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
      type: Date,
      required: true,
    },

    openPrice: {
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
    tradeQuantity: {
      type: Number,
      required: [true, "You must specify the trade quantity"],
    },
    closingEntries: [
      {
        price: Number,
        quantity: Number,
        date: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    currentHoldings: {
      type: Number,
    },
    user: {
      type: mongose.Schema.ObjectId,
      ref: "user",
      required: true,
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
//populatinng the trader field
tradeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
  });
  next();
});
// tradeSchema.plugin(require("mongoose-autopopulate"));
tradeSchema.virtual("profitLoss").get(function () {
  if (this.currentHoldings != 0) return;
  return (this.profitLoss =
    (this.closingPriceCalculated - this.openPrice) * this.tradeQuantity);
});
const Trade = mongose.model("Trade", tradeSchema);

module.exports = Trade;
