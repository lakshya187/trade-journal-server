const express = require("express");
const Equity = require("../models/tradeModel");
const Options = require("../models/optionsModel");
const luxon = require("luxon");
const router = express.Router();

exports.returns = async (req, res) => {
  try {
    const currentDate = new Date(Date.now());
    const hours = luxon.DateTime.local().hour;
    const daysIntoMonth = luxon.DateTime.local().day;
    const daysIntoWeek = luxon.DateTime.fromISO(
      currentDate.toISOString()
    ).weekday;
    const monthsIntoYear = luxon.DateTime.fromObject().c.month - 1;
    const day = new Date(
      luxon.DateTime.local(currentDate).minus({ hours: hours }).toISO()
    );
    // console.log(day);
    const week = new Date(
      luxon.DateTime.local(currentDate).minus({ days: daysIntoWeek }).toISO()
    );

    const month = new Date(
      luxon.DateTime.local(currentDate).minus({ days: daysIntoMonth }).toISO()
    );
    const year = new Date(
      luxon.DateTime.local(currentDate)
        .minus({ days: daysIntoMonth, months: monthsIntoYear })
        .toISO()
    );
    console.log(year);
    const equityReturns = await Equity.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          tradeCreatedOn: 1,
          profitLoss: 1,
        },
      },
      {
        $group: {
          _id: "Equity Returns",
          daily: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", day],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
          weekly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", week],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
          monthly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", month],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
          yearly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", year],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
        },
      },
    ]);
    const optionsReturn = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          netProfitLoss: 1,
          tradeCreatedOn: 1,
        },
      },
      {
        $group: {
          _id: "Options Returns",
          daily: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", day],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
          weekly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", week],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
          monthly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", month],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
          yearly: {
            $sum: {
              $cond: [
                {
                  $gt: ["$tradeCreatedOn", year],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
        },
      },
    ]);
    const equity = equityReturns[0];
    const options = optionsReturn[0];
    console.log({ equity, options });
    const returns = {
      daily: equity.daily + options.daily,
      weekly: equity.weekly + options.weekly,
      monthly: equity.monthly + options.monthly,
      yearly: equity.yearly + options.yearly,
    };
    res.status(200).json({
      status: "success",
      returns,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.getReturnsEquityMonthly = async (req, res) => {
  try {
    const currentDate = new Date(Date.now());
    const monthsToSub = currentDate.getMonth();
    const daysTOSub = luxon.DateTime.local(currentDate).day - 1;
    const start = new Date(
      luxon.DateTime.local(currentDate)
        .minus({ months: monthsToSub, days: daysTOSub })
        .toISO()
    );
    const end = new Date(Date.now());
    const data = await Equity.aggregate([
      {
        $match: {
          $and: [
            { user: req.user._id },
            {
              tradeCreatedOn: {
                $gte: start,
              },
            },
            {
              tradeCreatedOn: {
                $lte: end,
              },
            },
          ],
        },
      },
      {
        $project: {
          month: { $month: "$tradeCreatedOn" },
          profitLoss: 1,
          trade: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$month",
          netProfitLoss: { $sum: "$profitLoss" },
        },
      },
    ]);
    const modData = data.sort((a, b) => {
      return a._id - b._id;
    });

    res.status(200).json({
      status: "success",
      modData,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    res.status(200).json({
      status: "success",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.getMainDashboardStats = async (req, res) => {
  try {
    const equity = await Equity.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $group: {
          _id: "Equity",
          totalTrades: {
            $sum: 1,
          },
          netReturns: {
            $sum: "$profitLoss",
          },
        },
      },
    ]);
    const options = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $group: {
          _id: "Options",
          totalTrades: {
            $sum: 1,
          },
          netReturns: {
            $sum: "$netProfitLoss",
          },
        },
      },
    ]);
    const data = {
      totalTrades: equity[0].totalTrades + options[0].totalTrades,
      netReturns: equity[0].netReturns + options[0].netReturns,
      totalOptionsTrades: options[0].totalTrades,
      totalEquityTrades: equity[0].totalTrades,
      returnsOptions: options[0].netReturns,
      returnsEquity: equity[0].netReturns,
    };
    console.log(data);
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (e) {
    res.status(400).json({
      status: "failed",
    });
  }
};

exports.riskRewardRatio = async (req, res) => {
  try {
    const { _id } = req.user;
    const equityData = await Equity.aggregate([
      {
        $match: { user: _id },
      },
      {
        $project: {
          loss: {
            $sum: {
              $cond: [
                {
                  $lt: ["$profitLoss", 0],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
          profit: {
            $sum: {
              $cond: [
                {
                  $gt: ["$profitLoss", 0],
                },
                {
                  $sum: "$profitLoss",
                },
                null,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "riskReward",
          profit: { $sum: "$profit" },
          loss: { $sum: "$loss" },
        },
      },
    ]);
    const equityRiskReward = Math.ceil(
      equityData[0].profit / Math.abs(equityData[0].loss)
    );
    const optionsData = await Options.aggregate([
      {
        $match: {
          user: _id,
        },
      },
      {
        $project: {
          profit: {
            $sum: {
              $cond: [
                { $gt: ["$netProfitLoss", 0] },
                { $sum: "$netProfitLoss" },
                null,
              ],
            },
          },
          loss: {
            $sum: {
              $cond: [
                {
                  $lt: ["$netProfitLoss ", 0],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: "profitLoss",
          loss: { $sum: "$loss" },
          profit: { $sum: "$profit" },
        },
      },
    ]);
    const optionsRiskReward = Math.ceil(
      optionsData[0].profit / Math.abs(optionsData[0].loss)
    );
    res.status(200).json({
      message: "success",
      data: {
        optionsRiskReward,
        equityRiskReward,
      }
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "failed",
      e,
    });
  }
};
