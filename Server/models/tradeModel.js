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
    closingPriceCalculated: {
      type: Number,
      default: 0,
    },
    profitLoss: {
      type: Number,
      default: 0,
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

//populatinng the trader field
tradeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
  });
  next();
});

const Trade = mongose.model("Trade", tradeSchema);

module.exports = Trade;
