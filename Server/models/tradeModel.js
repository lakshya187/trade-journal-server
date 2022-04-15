const mongose = require("mongoose");

const tradeSchema = new mongose.Schema(
  {
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
    openDate: {
      type: String,
    },
    closeDate: {
      type: String,
    },
    openPrice: {
      type: Number,
    },
    closePrice: {
      type: Number,
      default: 0,
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
    tradeQuantity: {
      type: Number,
      required: [true, "You must specify the trade quantity"],
    },
    closingEntries: [
      {
        price: Number,
        quantity: Number,
      },
    ],
    currentHoldings: {
      type: Number,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
    },
  }
);
tradeSchema.pre("save", function (next) {
  this.currentHoldings = this.tradeQuantity;
  next();
});
//Calculating the closingPrice
tradeSchema.virtual("closingPriceCalculated").get(function () {
  let val = 0;
  if (this.currentHoldings != 0) return;
  this.closingEntries.forEach((el) => {
    const { price, quantity } = el;

    val += price * quantity;
  });

  return (this.closingPriceCalculated = val / this.tradeQuantity);
});

tradeSchema.virtual("profitLoss").get(function () {
  if (this.currentHoldings != 0) return;
  if (this.closePrice != 0) {
    return (this.profitLoss = this.profitLoss =
      this.closePrice - this.openPrice);
  }
  if (this.closingPriceCalculated != 0) {
    return (this.profitLoss =
      (this.closingPriceCalculated - this.openPrice) * this.tradeQuantity);
  }
});
const Trade = mongose.model("Trade", tradeSchema);

module.exports = Trade;
