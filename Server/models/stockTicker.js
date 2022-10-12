const Mongoose = require("mongoose");

const tickerSchema = new Mongoose.Schema({
  ticker: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
  },
});

const Ticker = new Mongoose.model("Ticker", tickerSchema);
module.exports = Ticker;
