const yahooFinance = require('yahoo-finance');

async function getHistoricalData(symbol, startDate, endDate) {
  const result = await yahooFinance.historical({
    symbol: symbol,
    from: startDate,
    to: endDate,
  });
  return result;
}


function calculateStandardDeviation(values) {
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  console.log('year return mean', mean);
  const sumOfSquares = values.reduce((acc, val) => acc + (val - mean) ** 2, 0);
  //console.log('sumOfSquares', sumOfSquares, values.length)
  const standardDeviation = Math.sqrt(sumOfSquares / values.length);
  return standardDeviation;
}

function calculateDailyReturn(historicalData, i) {
  const dailyReturn = ((historicalData[i].close - historicalData[i - 1].close) / historicalData[i - 1].close);
  return dailyReturn;
}

const symbol = 'SPY';
const startDate = '2014-01-01';
const endDate = '2024-01-01';
const startingValue = 100000;
const monthlyInvestment = 1500;
const commission = 5; // Commissione per ogni acquisto mensile
let investedValue = startingValue;
let maxDrawdownAlwaysInvested = 0;
let maxDrawdown = 0;
let peakAlwaysInvested = -Infinity;
let peak = -Infinity;
const sellThreshold = 0.1; // Soglia di vendita (10% inferiore al massimo)
const buyThreshold = 0.05; // Soglia di ricompra (5% inferiore al massimo)
let holding = false;


getHistoricalData(symbol, startDate, endDate)
  .then((historicalData) => {

    historicalData = historicalData.reverse();
    // Calcoliamo il valore del portafoglio per ogni giorno
    const portfolioValuesAlwaysInvested = [startingValue];
    const portfolioValues = [startingValue];
    const startingPrice = historicalData[0].close;
    const finalPrice = historicalData[historicalData.length - 1].close;
    const annualReturnsAlwaysInvested = {};
    const annualReturns = {};
    let lastOrderPrice = 1;
    let investedDays = 0;
    let totalDays = 0;

    for (let i = 1; i < historicalData.length; i++) {
      //console.log('starting value of today', portfolioValuesAlwaysInvested[i - 1], historicalData[i].close, historicalData[i - 1].close)
      const dailyReturn = calculateDailyReturn(historicalData, i);
      //if is last working day of the month, add monthly investment
      if (historicalData[i].date.getDate() === new Date(historicalData[i].date.getFullYear(), historicalData[i].date.getMonth() + 1, 0).getDate()) {
        portfolioValuesAlwaysInvested[i - 1] += monthlyInvestment;
        portfolioValues[i - 1] += monthlyInvestment;
        // Aggiungi la commissione per l'acquisto mensile
        portfolioValuesAlwaysInvested[i - 1] -= commission;
        if (!holding) {
          portfolioValues[i - 1] -= commission;
        }
        //console.log('monthly investment', historicalData[i].date, portfolioValuesAlwaysInvested[i - 1]);
        investedValue += monthlyInvestment;
      }

      const portfolioValueAlwaysInvested = portfolioValuesAlwaysInvested[i - 1] * (1 + Number(dailyReturn.toFixed(5)));

      const year = historicalData[i].date.getFullYear();
      if (!annualReturnsAlwaysInvested[year]) {
        annualReturnsAlwaysInvested[year] = [];
      }
      annualReturnsAlwaysInvested[year].push(dailyReturn);
      if (!annualReturns[year]) {
        annualReturns[year] = [];
      }
      if (!holding) {
        annualReturns[year].push(dailyReturn);
      }
      // Calcolo del massimo drawdown
      peakAlwaysInvested = Math.max(peakAlwaysInvested, portfolioValueAlwaysInvested);
      const drawdown = (portfolioValueAlwaysInvested - peakAlwaysInvested) / peakAlwaysInvested;
      maxDrawdownAlwaysInvested = Math.min(maxDrawdownAlwaysInvested, drawdown);

      //console.log(historicalData[i].date, dailyReturn, portfolioValue);
      portfolioValuesAlwaysInvested.push(portfolioValueAlwaysInvested);

      // portafoglio reale (non sempre investito)
      let portfolioValue = portfolioValues[i - 1];
      if (!holding) {
        investedDays += 1;
        portfolioValue *= (1 + Number(dailyReturn.toFixed(5)));
      }
      peak = Math.max(peak, portfolioValue);
      const dd = (portfolioValue - peak) / peak;
      if (!holding) {
        if (maxDrawdown > dd) console.log('drawdown', historicalData[i].date, dd, peak, portfolioValue, historicalData[i].close)
        maxDrawdown = Math.min(maxDrawdown, dd);
      }

      totalDays += 1;

      // Se il portafoglio è sceso del 10% rispetto al massimo, vendi
      if (!holding && portfolioValue / peakAlwaysInvested < 1 - sellThreshold && historicalData[i].close / lastOrderPrice > (1 + buyThreshold)) {
        console.log('Sell at', historicalData[i].date, 'Price:', historicalData[i].close);
        holding = true;
        portfolioValues[i - 1] -= commission; // Sottrai la commissione per la vendita
        lastOrderPrice = historicalData[i].close;
      }
      if (holding && historicalData[i].close / lastOrderPrice > 1) { // TODO Se il prezzo è salito del 0% rispetto all'ultimo acquisto, compra
        console.log('Buy at', historicalData[i].date, 'Price:', historicalData[i].close);
        holding = false;
        lastOrderPrice = historicalData[i].close;
        portfolioValues[i - 1] -= commission; // Sottrai la commissione per l'acquisto
      }

      portfolioValues.push(portfolioValue);
    }

    for (const year in annualReturnsAlwaysInvested) {
      const sumReturns = annualReturnsAlwaysInvested[year].reduce((acc, val) => acc + val, 0);
      const averageReturn = sumReturns;
      annualReturnsAlwaysInvested[year] = averageReturn;
    }

    for (const year in annualReturns) {
      const sumReturns = annualReturns[year].reduce((acc, val) => acc + val, 0);
      const averageReturn = sumReturns;
      annualReturns[year] = averageReturn;
    }

    const deviation = calculateStandardDeviation(Object.values(annualReturnsAlwaysInvested));

    console.log(startingPrice + ' -> ' + finalPrice, 'Total yield %:', (finalPrice - startingPrice) * 100 / startingPrice,
      'Invested:', investedValue, 'Final:', portfolioValuesAlwaysInvested[portfolioValuesAlwaysInvested.length - 1],
      'Total yield %:', (portfolioValuesAlwaysInvested[portfolioValuesAlwaysInvested.length - 1] - investedValue) * 100 / investedValue);
    console.log('Standard deviation always invested:', deviation, 'other investments:', calculateStandardDeviation(Object.values(annualReturns)));
    console.log('Maximum drawdown always invested:', maxDrawdownAlwaysInvested, 'other investments:', maxDrawdown);
    console.log('Invested days:', investedDays, 'Total days:', totalDays);

    console.log('Invested:', investedValue, 'Final:', portfolioValues[portfolioValues.length - 1],
      'Total yield %:', (portfolioValues[portfolioValues.length - 1] - investedValue) * 100 / investedValue);

  })
  .catch((error) => {
    console.error('Error fetching historical data:', error);
  });
