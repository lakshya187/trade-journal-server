const mongose = require("mongoose");

const tradeSchema = new mongose.Schema({
  stockTicker: {
    required: [true],
    type: String,
  },
  stockName: {
    required: true,
    type: String,
  },
  typeOfTrade: {
    required: true,
    type: String,
  },
  boughtOn: {
    type: Date,
  },
  soldOn: {
    type: Date,
  },
  buyingPrice: {
    type: Number,
  },
  sellingPrice: {
    type: Number,
  },
  entryAnalysis: {
    type: String,
  },
  exitAnalysis: {
    type: String,
  },
  tradeCreatedOn: {
    type: Date,
    default: Date.now(),
  },
  notes: {
    type: String,
    default: "No notes added",
  },
});
const Trade = mongose.model("Trade", tradeSchema);

module.exports = Trade;
