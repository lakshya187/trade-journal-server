const Options = require("../models/optionsModel");

exports.getProfitLossPremium = async (req, res) => {
  try {
    const { gt } = req.body;
    const { lt } = req.body;
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          profitLoss: {
            $cond: [
              {
                $and: [
                  {
                    $gte: ["$netPremium", gt],
                  },
                  {
                    $lte: ["$netPremium", lt],
                  },
                ],
              },
              {
                $sum: "$netProfitLoss",
              },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$profitLoss",
        },
      },
    ]);
    res.status(200).json({
      status: "sucess",
      data,
    });
  } catch (e) {
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getProfitLossTypeOfTrade = async (req, res) => {
  try {
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          typeOfTrade: 1,
          profitLoss: {
            $sum: "$netProfitLoss",
          },
        },
      },
      {
        $group: {
          _id: "$typeOfTrade",
          profitLoss: { $sum: "$profitLoss" },
        },
      },
    ]);
    res.status(200).json({
      status: "sucess",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      stats: "failed",
      message: e,
    });
  }
};

exports.getProfitLossDaysToExpire = async (req, res) => {
  try {
    // const gt = req.body
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          daysHeld: {
            $round: [
              {
                $divide: [
                  {
                    $subtract: ["$expireDate", "$openDate"],
                  },
                  1000 * 60 * 60 * 24,
                ],
              },
              0,
            ],
          },
          netProfitLoss: 1,
        },
      },
      {
        $group: {
          _id: "$daysHeld",
          profitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    res.status(200).json({
      status: "sucess",
      data,
    });
  } catch (e) {
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
