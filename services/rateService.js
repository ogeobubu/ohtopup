const Rate = require("../model/Rate");

const getRates = async () => {
  let rates = await Rate.findOne().exec();

  if (!rates) {
    rates = new Rate({ withdrawalRate: 0, depositRate: 0 });
    await rates.save();
  }

  return rates;
};

const setRates = async (withdrawalRate, depositRate) => {
  let rates = await Rate.findOne().exec();

  if (rates) {
    rates.withdrawalRate = withdrawalRate;
    rates.depositRate = depositRate;
    await rates.save();
  } else {
    rates = new Rate({ withdrawalRate, depositRate });
    await rates.save();
  }

  return rates;
};

module.exports = {
  getRates,
  setRates,
};
