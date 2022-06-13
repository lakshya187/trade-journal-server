const mongoose = require("mongoose");
const { options } = require("../routes/tradeRoutes");
const optionsSchema = new mongoose.Schema({
  strategyName: {
    type: String,
    required: true,
  },
  ticker: {
    type: String,
    required: true,
  },
  underlying: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  netProfitLoss: { type: Number },
  leg: [
    {
      expireDate: { type: Date, required: true },
      premium: { type: Number, required: true },
      lotSize: { type: Number, required: true },
      quantity: { type: Number, required: true },
      optionType: { type: String, required: true },
      strike: { type: String, required: true },
      profitLoss: { type: Number, default: 0 },
      currentHoldings: {
        type: Number,
        default: 0,
      },
      closingPremium: { default: 0, type: Number },
      typeOfTrade: {
        type: String,
        required: true,
      },
      totalQuantity: {
        type: Number,
        default: 0,
      },
      openDate: {
        type: Date,
        required: true,
      },

      closingEntries: [
        {
          premium: Number,
          quantity: Number,
          date: {
            type: Date,
          },
          totalQuantitySold: Number,
        },
      ],
    },
  ],

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "user",
    required: true,
  },
  entryAnalysis: {
    type: String,
  },
  notes: {
    type: String,
    default: "No notes added",
  },
});

optionsSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
  });
  next();
});

optionsSchema.pre("save", function (next) {
  this.leg.forEach((l, i) => {
    this.leg[i].totalQuantity = l.quantity * l.lotSize;
  });
  next();
});

const Options = new mongoose.model("Options", optionsSchema);
module.exports = Options;
