const yahooFinance = require('yahoo-finance');

async function getHistoricalData(symbol, startDate, endDate) {
  const result = await yahooFinance.historical({
    symbol: symbol,
    from: startDate,
    to: endDate,
  });
  return result;
}

const symbol = 'SPY';
const startDate = '2022-01-01';
const endDate = '2024-01-31';
const startingValue = 10000;
const monthlyInvestment = 1000;
let investedValue = startingValue;

getHistoricalData(symbol, startDate, endDate)
  .then((historicalData) => {

    historicalData = historicalData.reverse();
    // Calcoliamo il valore del portafoglio per ogni giorno
    const portfolioValues = [startingValue];
    const startingPrice = historicalData[0].close;
    const finalPrice = historicalData[historicalData.length - 1].close;

    for (let i = 1; i < historicalData.length; i++) {
      //console.log('starting value of today', portfolioValues[i - 1], historicalData[i].close, historicalData[i - 1].close)
      const dailyReturns = (historicalData[i].close / historicalData[i - 1].close);
      //if is last working day of the month, add monthly investment
      if (historicalData[i].date.getDate() === new Date(historicalData[i].date.getFullYear(), historicalData[i].date.getMonth() + 1, 0).getDate()) {
        portfolioValues[i - 1] += monthlyInvestment;
        //console.log('monthly investment', historicalData[i].date, portfolioValues[i - 1]);
        investedValue += monthlyInvestment;
      }

      const portfolioValue = portfolioValues[i - 1] * Number(dailyReturns.toFixed(5));
      //console.log(historicalData[i].date, dailyReturns, portfolioValue);
      portfolioValues.push(portfolioValue);
    }
    console.log(startingPrice + ' -> ' + finalPrice, 'Total yield %:', (finalPrice - startingPrice) * 100 / startingPrice, 'Invested:', investedValue, 'Final:', portfolioValues[portfolioValues.length - 1], 'Total yield %:', (portfolioValues[portfolioValues.length - 1] - investedValue) * 100 / investedValue);


  })
  .catch((error) => {
    console.error('Error fetching historical data:', error);
  });
