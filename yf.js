const yahooFinance2 = require('yahoo-finance2').default;
const nodeplotlib = require('nodeplotlib');

const symbol = 'SPY';
const startDate = '2014-01-01';
const endDate = '2024-01-01';
const startingValue = 100000;
const monthlyInvestment = 1500;
const commission = 5; // Commissione per ogni acquisto/vendita
const sellThreshold = -0.1; // Soglia di vendita (10% inferiore al massimo)
const buyThreshold = 0.05; // Soglia di ricompra (5% inferiore al massimo)
const maximumDrawdownBuy = 0.25; // Soglia di drawdown massimo per ricomprare
const taxPercentage = 0.26; // Tassazione italiana plusvalenze finanziarie

const enableTaxes = true; //per abilitare o disabilitare la tassazione a fine calcolo
const enableMaxDrawdownInvesting = true; // per abilitare o disabilitare l'investimento in caso di drawdown pesante

async function getHistoricalData(symbol, startDate, endDate) {
  const result = await yahooFinance2.historical(symbol, {
    period1: startDate,
    period2: endDate,
  });
  return result;
}

function calculateStandardDeviation(values) {
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  //console.log('year return mean', mean);
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

function getFixedN(value, n) {
  return Number(value.toFixed(n));
}

function getAnnualCompoundRate(rate, time) {
  return Math.pow((1 + rate), 1 / time) - 1;
}

let investedValue = startingValue;
let maxDrawdownAlwaysInvested = 0;
let maxDrawdown = 0;
let peakAlwaysInvested = -Infinity;
let peak = -Infinity;
let holding = false; //se si è sul mercato è false, se si "tengono" i soldi è true
let lastOrderPrice = 1;
let investedDays = 0;
let totalDays = 0;
let alreadyTaxed = 0;
let alreadyInvestedValue = 0;
const portfolioValuesAlwaysInvested = [startingValue]; // tutti i valori del portafoglio sempre investito
const portfolioValues = [startingValue]; // tutti i valori del portafoglio "strategia"
const annualReturnsAlwaysInvested = {};
const annualReturns = {};
const sellDates = [];
const buyDates = [];
const buyDrawdownDates = [];

getHistoricalData(symbol, startDate, endDate)
  .then((historicalData) => {
    const startingPrice = historicalData[0].close; //prezzo quota iniziale
    const finalPrice = historicalData[historicalData.length - 1].close; //prezzo quota finale


    for (let i = 1; i < historicalData.length; i++) {
      const dailyReturn = calculateDailyReturn(historicalData, i);
      // se è l'ultimo giorno del mese, aggiungi l'investimento mensile per il PAC
      if (historicalData[i].date.getDate() === new Date(historicalData[i].date.getFullYear(), historicalData[i].date.getMonth() + 1, 0).getDate()) {
        portfolioValuesAlwaysInvested[i - 1] += monthlyInvestment;
        portfolioValues[i - 1] += monthlyInvestment;
        // Aggiungi la commissione per l'acquisto mensile
        portfolioValuesAlwaysInvested[i - 1] -= commission;
        if (!holding) {
          portfolioValues[i - 1] -= commission;
        }
        investedValue += monthlyInvestment;
      }
      // se sono nel caso sempre investito, aggiungo il rendimento giornaliero
      const portfolioValueAlwaysInvested = portfolioValuesAlwaysInvested[i - 1] * (1 + getFixedN(dailyReturn, 5));

      // aggiungo i dati ai rendimenti per calcolare la varianza alla fine
      const year = historicalData[i].date.getFullYear();
      if (!annualReturnsAlwaysInvested[year]) {
        annualReturnsAlwaysInvested[year] = [];
      }
      annualReturnsAlwaysInvested[year].push(dailyReturn);
      if (!annualReturns[year]) {
        annualReturns[year] = [];
      }

      // Calcolo del massimo drawdown per il caso sempre investito
      peakAlwaysInvested = Math.max(peakAlwaysInvested, portfolioValueAlwaysInvested);
      const drawdownAlwaysInvested = (portfolioValueAlwaysInvested - peakAlwaysInvested) / peakAlwaysInvested;
      maxDrawdownAlwaysInvested = Math.min(maxDrawdownAlwaysInvested, drawdownAlwaysInvested);

      portfolioValuesAlwaysInvested.push(portfolioValueAlwaysInvested);

      totalDays += 1;

      // PORTAFOGLIO REALE (non sempre investito)

      let portfolioValue = portfolioValues[i - 1];
      if (!holding) {
        // sono investito, dopo aver calcolati i valori, valuto se devo vendere
        annualReturns[year].push(dailyReturn);
        investedDays += 1;
        portfolioValue *= (1 + getFixedN(dailyReturn, 5));

        // creo il picco e il drawdown, per poterlo utilizzare nei calcoli
        peak = Math.max(peak, portfolioValue);
        const drawdown = (portfolioValue - peak) / peak;
        if (drawdown < maxDrawdown) {
          console.log('drawdown!', historicalData[i].date, drawdown, portfolioValue, peak);
        }
        maxDrawdown = Math.min(maxDrawdown, drawdown);


        // se il drawdown è maggiore della soglia di vendita o sono nell'ultima giornata disponibile (per la tassazione), vendo
        if (drawdown < sellThreshold || i === (historicalData.length - 1)) {
          console.log('VENDO', historicalData[i].date, historicalData[i].close, getFixedN(dailyReturn, 3), sellThreshold - drawdown);
          sellDates.push(historicalData[i].date);
          holding = true;
          lastOrderPrice = historicalData[i].close;
          portfolioValues[i - 1] -= commission;
          // se devo calcolare le tasse, calcolo la parte di PAC mai tassata e quella già tassata 
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
        // non sono investito, valuto se devo ricomprare
        const buyPrice = lastOrderPrice * (1 + buyThreshold);
        if (historicalData[i].close > buyPrice) {
          annualReturns[year].push((historicalData[i].close / buyPrice) - 1);
          console.log('RICOMPRO', historicalData[i].date, historicalData[i].close, getFixedN(dailyReturn, 3), portfolioValue);
          buyDates.push(historicalData[i].date);
          portfolioValue = portfolioValue * historicalData[i].close / buyPrice; //per adattare al rendimento "perso" prendendo il dato di close
          holding = false;
          // qui aggiorno il picco per fare in modo che non esca il giorno dopo l'ingresso.
          peak = peak * 0.95;
          portfolioValues[i - 1] -= commission;
          lastOrderPrice = historicalData[i].close;
        }
        // nel caso del max drawdown, se il drawdown è maggiore della soglia, ricompro
        const drawdownBuyPrice = lastOrderPrice * (1 - maximumDrawdownBuy);
        if (enableMaxDrawdownInvesting && historicalData[i].close < drawdownBuyPrice) {
          annualReturns[year].push(historicalData[i].close / drawdownBuyPrice - 1);
          console.log('drawdown pesante! RICOMPRO', historicalData[i].date, historicalData[i].close, getFixedN(dailyReturn, 2), historicalData[i].close / drawdownBuyPrice);
          buyDrawdownDates.push(historicalData[i].date);
          portfolioValue = portfolioValue * historicalData[i].close / drawdownBuyPrice;
          holding = false;
          // qui aggiorno il picco per fare in modo che non esca il giorno dopo l'ingresso.
          peak = peak * 0.95;
          portfolioValues[i - 1] -= commission;
          lastOrderPrice = historicalData[i].close;
        }

      }
      portfolioValues.push(portfolioValue);

    }

    // calcolo la media dei rendimenti annuali
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

    const lastValueAlwaysInvested = portfolioValuesAlwaysInvested[portfolioValuesAlwaysInvested.length - 1];
    const finalValueStrategy = (portfolioValues[portfolioValues.length - 1] - investedValue) / investedValue;
    const valueAfterTaxesAlwaysInvested = calculateValueAfterTax(lastValueAlwaysInvested, investedValue);
    const finalValueAlwaysInvested = (valueAfterTaxesAlwaysInvested - investedValue) / investedValue;

    // calcolo deviazione standard e valore dopo le tasse
    const deviation = calculateStandardDeviation(Object.values(annualReturnsAlwaysInvested));


    console.log('\nCASO SEMPRE INVESTITO:');
    console.log('RENDIMENTO QUOTA %:', getFixedN((finalPrice - startingPrice) * 100 / startingPrice, 2),
      'INVESTITO:', investedValue, 'VALORE FINALE:', getFixedN(lastValueAlwaysInvested, 2),
      'INCREMENTO VALORE FINALE PAC %:', getFixedN(100 * (lastValueAlwaysInvested - investedValue) / investedValue, 2),
      'VALORE POST TASSAZIONE', getFixedN(valueAfterTaxesAlwaysInvested, 2),
      'RENDIMENTO POST TASSAZIONE TOTALE %', getFixedN(100 * finalValueAlwaysInvested, 2)
    );
    console.log('DEVIAZIONE STANDARD', getFixedN(deviation, 3), 'MAX DRAWDOWN %', getFixedN(maxDrawdownAlwaysInvested * 100, 2));

    console.log('\nCASO STRATEGIA:');
    console.log(
      'INVESTITO:', investedValue, 'VALORE FINALE:', getFixedN(portfolioValues[portfolioValues.length - 1], 2),
      'VALORE FINALE PAC POST TASSAZIONE %:', getFixedN(100 * finalValueStrategy, 2),
    );
    console.log('DEVIAZIONE STANDARD', getFixedN(calculateStandardDeviation(Object.values(annualReturns)), 3), 'MAX DRAWDOWN %', getFixedN(maxDrawdown * 100, 2));
    console.log('INVESTITO', investedDays, 'GIORNI SU UN TOTALE DI', totalDays);

    console.log('\nRENDIMENTO ANNUALE MEDIO SEMPRE INVESTITO %', getFixedN(100 * getAnnualCompoundRate(finalValueAlwaysInvested, Object.keys(annualReturnsAlwaysInvested).length), 2));
    console.log('RENDIMENTO ANNUALE MEDIO STRATEGIA %', getFixedN(100 * getAnnualCompoundRate(finalValueStrategy, Object.keys(annualReturns).length), 2));

    // Da qui in poi sono tutti parametri per il grafico
    const labels = historicalData.map((data) => data.date);
    const sellShapes = sellDates.map((date) => {
      return {
        type: 'line',
        x0: date,
        y0: 0,
        x1: date,
        y1: Math.max(...portfolioValues, ...portfolioValuesAlwaysInvested) * 1.05,
        line: {
          color: 'red',
          width: 1.5,
          dash: 'dot'
        }
      }
    });
    const buyShapes = buyDates.map((date) => {
      return {
        type: 'line',
        x0: date,
        y0: 0,
        x1: date,
        y1: Math.max(...portfolioValues, ...portfolioValuesAlwaysInvested) * 1.05,
        line: {
          color: 'blue',
          width: 1.5,
          dash: 'dot'
        }
      }
    });
    const buyDrawdownShapes = buyDrawdownDates.map((date) => {
      return {
        type: 'line',
        x0: date,
        y0: 0,
        x1: date,
        y1: Math.max(...portfolioValues, ...portfolioValuesAlwaysInvested) * 1.05,
        line: {
          color: 'grey',
          width: 1.5,
          dash: 'dot'
        }
      }
    });

    const outOfMarketIntervals = sellDates.map(sd => {
      const date = buyDates.find(bd => bd > sd);
      const drawdownDate = buyDrawdownDates.find(dd => dd > sd);
      let finalDate = new Date(endDate);
      if (date) {
        if (drawdownDate) {
          finalDate = Math.min(date, drawdownDate);
        }
        else {
          finalDate = date;
        }
      }
      else if (drawdownDate) {
        finalDate = drawdownDate;
      }
      return {
        type: 'rect',
        layer: 'below',
        xref: 'x', yref: 'paper',
        x0: sd, x1: finalDate,
        y0: 0, y1: 1,
        fillcolor: 'rgba(200,200,200,0.5)',
        line: { width: 0 }
      }
    });

    const data = [{
      x: labels,
      y: portfolioValuesAlwaysInvested,
      type: 'line',
      name: 'Sempre investito'
    }, {
      x: labels,
      y: portfolioValues,
      type: 'lines',
      name: 'Strategia'
    }];

    // Opzioni del layout
    const layout = {
      title: 'Andamento del Patrimonio investito in ' + symbol,
      xaxis: {
        title: 'Date'
      },
      yaxis: {
        title: 'Patrimonio'
      },
      shapes: [
        //...sellShapes,
        //...buyShapes,
        ...buyDrawdownShapes,
        ...outOfMarketIntervals
      ]
    };
    // Crea il grafico
    nodeplotlib.plot(data, layout);

  })
  .catch((error) => {
    console.error('Error fetching historical data:', error);
  });
