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

function calculateValueAfterTax(finalValue, initialValue) {
  const tax = (finalValue - initialValue) * taxPercentage;
  //console.log(initialValue, finalValue, tax, finalValue - tax);
  return tax > 0 ? finalValue - tax : finalValue;
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
const sellThreshold = -0.1; // Soglia di vendita (10% inferiore al massimo)
const buyThreshold = 0.05; // Soglia di ricompra (5% inferiore al massimo)
let holding = false;
const portfolioValuesAlwaysInvested = [startingValue];
const portfolioValues = [startingValue];
const annualReturnsAlwaysInvested = {};
const annualReturns = {};
let lastOrderPrice = 1;
let investedDays = 0;
let totalDays = 0;
const taxPercentage = 0.26;
const enableTaxes = true;
let alreadyTaxed = 0;
let alreadyInvestedValue = 0;

getHistoricalData(symbol, startDate, endDate)
  .then((historicalData) => {

    historicalData = historicalData.reverse();

    const startingPrice = historicalData[0].close;
    const finalPrice = historicalData[historicalData.length - 1].close;

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

      // Calcolo del massimo drawdown
      peakAlwaysInvested = Math.max(peakAlwaysInvested, portfolioValueAlwaysInvested);
      const drawdownAlwaysInvested = (portfolioValueAlwaysInvested - peakAlwaysInvested) / peakAlwaysInvested;
      maxDrawdownAlwaysInvested = Math.min(maxDrawdownAlwaysInvested, drawdownAlwaysInvested);

      //console.log(historicalData[i].date, dailyReturn, portfolioValue);
      portfolioValuesAlwaysInvested.push(portfolioValueAlwaysInvested);

      totalDays += 1;

      // portafoglio reale (non sempre investito)
      // se risale alla quota a cui l'ho venduto più il 5%, ricompra

      let portfolioValue = portfolioValues[i - 1];
      if (!holding) {
        annualReturns[year].push(dailyReturn);
        investedDays += 1;
        portfolioValue *= (1 + Number(dailyReturn.toFixed(5)));

        //creo il picco dinamico per poterlo utilizzare nei calcoli
        peak = Math.max(peak, portfolioValue);
        const drawdown = (portfolioValue - peak) / peak;
        maxDrawdown = Math.min(maxDrawdown, drawdown);

        if (drawdown < sellThreshold) {
          console.log('venduto', historicalData[i].date, portfolioValue, Number(dailyReturn.toFixed(2)));
          holding = true;
          lastOrderPrice = historicalData[i].close;
          portfolioValues[i - 1] -= commission;
          if (enableTaxes) {
            let newlyInPac = 0;
            if (alreadyTaxed === 0) {
              alreadyTaxed = investedValue;
            }
            else {
              newlyInPac = investedValue - alreadyInvestedValue;
            }
            //console.log('taxes', portfolioValue, alreadyTaxed, newlyInPac);

            portfolioValue = calculateValueAfterTax(portfolioValue, alreadyTaxed + newlyInPac);
            alreadyInvestedValue = investedValue;
            alreadyTaxed = portfolioValue;
          }
        }
      }
      else {
        if (historicalData[i].close > lastOrderPrice * (1 + buyThreshold)) {
          annualReturns[year].push((historicalData[i].close / lastOrderPrice) - 1);
          console.log('ricomprato', historicalData[i].date, portfolioValue, Number(dailyReturn.toFixed(2)));
          portfolioValue = portfolioValue * historicalData[i].close / lastOrderPrice; //per adattare al rendimento "perso" prendendo il dato di close
          holding = false;
          //peak = -Infinity;
          portfolioValues[i - 1] -= commission;
        }

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
    const valueAfterTaxesAlwaysInvested = calculateValueAfterTax(portfolioValuesAlwaysInvested[portfolioValuesAlwaysInvested.length - 1], investedValue);
    console.log('Always invested after tax value', valueAfterTaxesAlwaysInvested, 'Total yield %:', (valueAfterTaxesAlwaysInvested - investedValue) * 100 / investedValue);

    console.log('Standard deviation always invested:', deviation, 'other investments:', calculateStandardDeviation(Object.values(annualReturns)));
    console.log('Maximum drawdown always invested:', maxDrawdownAlwaysInvested, 'other investments:', maxDrawdown);
    console.log('Invested days:', investedDays, 'Total days:', totalDays);

    console.log('Invested:', investedValue, 'Final:', portfolioValues[portfolioValues.length - 1],
      'Total yield %:', (portfolioValues[portfolioValues.length - 1] - investedValue) * 100 / investedValue);

  })
  .catch((error) => {
    console.error('Error fetching historical data:', error);
  });
