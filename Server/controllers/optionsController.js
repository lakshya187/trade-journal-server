const luxon = require("luxon");
const express = require("express");
const Options = require("../models/optionsModel");
const User = require("../models/userModel");
const { months } = require("../utils/staticData");
const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const { day } = require("../utils/staticData");
const Trade = require("../models/tradeModel");
exports.getAllOptions = async (req, res, next) => {
  try {
    const options = await User.findById(req.user.id).populate({
      path: "allOptionsTrade",
      options: {
        sort: { openDate: -1 },
        skip: 0,
        limit: 10,
      },
      match: {},
    });
    res.status(200).json({
      status: "success",
      data: options,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
exports.createOptionTrades = async (req, res) => {
  try {
    // console.log(req.body);

    if (!req.body.user) {
      req.body.user = req.user.id;
    }
    let netPremiumStratLevel = 0;
    req.body.leg.forEach((l, i) => {
      l.currentHoldings = l.quantity * l.lotSize;
      if (l.typeOfTrade === "short") {
        l.premium = -l.premium;
      }
      netPremiumStratLevel += l.premium * l.quantity * l.lotSize;
    });
    req.body.netPremium = netPremiumStratLevel;
    req.body.netPremium > 0
      ? (req.body.typeOfTrade = "long")
      : (req.body.typeOfTrade = "short");
    console.log(req.body);
    // if(req.body.typeOfTrade > 0) {
    //   req.body.typeOfTrade =
    // }
    const newOptionsTrade = await Options.create(req.body);
    res.status(201).json({
      status: "success",
      data: newOptionsTrade,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
exports.updateClosingLeg = async (req, res) => {
  try {
    const currentTrade = await Options.findById(req.params.id);

    console.log(currentTrade);
    //Pushing closing entries
    const { optionType } = req.body;
    const { strike } = req.body;
    const { data } = req.body;
    const closingDate = new Date(data.date);
    const leg = currentTrade.leg.find((l) => {
      return l.strike === strike && l.optionType === optionType;
    });
    if (!leg) {
      throw new Error("Soemthing went wrong");
    }
    console.log(leg);
    data.totalQuantitySold = req.body.data.quantity * leg.lotSize;
    leg.closingEntries.push(data);
    //calculating closing price with each closing entry
    if (leg.currentHoldings === 0) {
      throw new Error("You cannot close anymore");
    }
    let val = 0;
    leg.closingEntries.forEach((e) => {
      val += e.premium * e.totalQuantitySold;
    });
    leg.closingPremium = val / leg.totalQuantity;
    leg.profitLoss = (leg.closingPremium - leg.premium) * leg.totalQuantity;
    const currHoldings = leg.currentHoldings - data.totalQuantitySold;
    leg.currentHoldings = currHoldings;
    let pAndL = 0;
    currentTrade.leg.forEach((l) => {
      pAndL += l.profitLoss;
    });
    leg.closeDate = closingDate;
    currentTrade.netProfitLoss = pAndL;

    console.log(currentTrade);

    const updatedtrade = await currentTrade.save();
    res.status(200).json({ status: "success", updatedtrade });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
exports.updateClosingStrat = async (req, res) => {
  try {
    const { data } = req.body;
    console.log(data);
    const trade = await Options.findById(req.params.id);
    let pl = 0;
    trade.leg.forEach((l, i) => {
      if (l.optionType === data[i].optionType && l.strike === data[i].strike) {
        if (l.currentHoldings === 0) {
          throw new Error("You cannot close anymore");
        }
        l.closingPremium = data[i].data.premium;
        l.profitLoss = (l.closingPremium - l.premium) * l.lotSize * l.quantity;
        l.currentHoldings = 0;
        l.closeDate = data[i].data.date;
        pl += l.profitLoss;
        l.closingEntries.push(data[i].data);
      }
    });
    trade.closeDate = data[0].data.date;
    trade.netProfitLoss = pl;
    console.log(trade);
    const updatedTrade = await trade.save();
    res.status(200).json({
      status: "success",
      message: "Trade updated sucesfully",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({ status: "failed", message: e });
  }
};
exports.getSingleOption = async (req, res) => {
  try {
    const trade = await Options.findById(req.params.id);
    res.status(200).json({
      message: "success",
      data: trade,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const currentDate = new Date(Date.now());

    const day = new Date(
      luxon.DateTime.local(currentDate)
        .minus({ hours: luxon.DateTime.local().hour })
        .toISO()
    );

    const daysIntoMonth = luxon.DateTime.local().day;
    const week = new Date(
      luxon.DateTime.local(currentDate).minus({ days: 7 }).toISO()
    );

    const month = new Date(
      luxon.DateTime.local(currentDate).minus({ days: daysIntoMonth }).toISO()
    );
    const halfYearly = new Date(
      luxon.DateTime.local(currentDate).minus({
        days: daysIntoMonth,
        months: 6,
      })
    );

    console.log(month, daysIntoMonth);

    const data = await Options.aggregate([
      {
        $facet: {
          overView: [
            {
              $match: {
                user: req.user._id,
              },
            },
            {
              $group: {
                _id: "overview",
                totalTrades: {
                  $sum: 1,
                },
                profitLossDay: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$tradeCreatedOn", day],
                      },
                      {
                        $sum: "$netProfitLoss",
                      },
                      null,
                    ],
                  },
                },
                profitLossWeek: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$tradeCreatedOn", week],
                      },
                      {
                        $sum: "$netProfitLoss",
                      },
                      null,
                    ],
                  },
                },
                netPLMonth: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$tradeCreatedOn", month],
                      },
                      {
                        $sum: "$netProfitLoss",
                      },
                      null,
                    ],
                  },
                },
                netPLSixMonths: {
                  $sum: {
                    $cond: [
                      {
                        $gte: ["$tradeCreatedOn", halfYearly],
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
          ],
          averageHoldingPeriod: [
            {
              $match: {
                user: req.user._id,
              },
            },
            {
              $unwind: "$leg",
            },
            {
              $project: {
                heldDays: {
                  $round: [
                    {
                      $divide: [
                        { $subtract: ["$leg.closeDate", "$leg.openDate"] },
                        1000 * 60 * 60 * 24,
                      ],
                    },
                    0,
                  ],
                },
                profitLoss: "$leg.profitLoss",
              },
            },
            // {
            //   $group: {
            //     _id: "Average Holding Period",
            //     value: { $avg: "$heldDays" },
            //   },
            // },
          ],
        },
      },
    ]);
    res.status(200).json({
      message: "sucess",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
exports.getDataMonth = async (req, res, next) => {
  // const start = new Date(req.body.start);
  // const end = new Date(req.body.end);
  const currentDate = new Date(Date.now());
  const monthsToSub = currentDate.getMonth();
  const daysTOSub = luxon.DateTime.local(currentDate).day - 1;
  const start = new Date(
    luxon.DateTime.local(currentDate)
      .minus({ months: monthsToSub, days: daysTOSub })
      .toISO()
  );
  const end = new Date(Date.now());
  try {
    const data = await Options.aggregate([
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
          netProfitLoss: 1,
          trade: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$month",
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    const modData = data.sort((a, b) => {
      return a._id - b._id;
    });

    res.status(200).json({
      status: "Sucess",
      modData,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getDataYear = async (req, res) => {
  try {
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    const data = await Options.aggregate([
      {
        $match: {
          $and: [
            { user: req.user._id },
            {
              tradeCreatedOn: {
                $gte: start,
                $lte: end,
              },
            },
          ],
        },
      },
      {
        $project: {
          year: { $year: "$tradeCreatedOn" },
          netProfitLoss: 1,
        },
      },
      {
        $group: {
          _id: { year: "$year" },
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    res.status(200).json({
      status: "sucess",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(200).json({
      status: "failed",
      message: e,
    });
  }
};
exports.getDataWeekly = async (req, res) => {
  try {
    const start = new Date(req.body.start);
    // const daysIntoWeek = luxon.DateTime.local();
    const daysIntoWeek = new Date(Date.now()).getDay();
    const week = new Date(
      luxon.DateTime.local(luxon.DateTime.local())
        .minus({ days: daysIntoWeek })
        .toISO()
    );

    console.log(week.setHours(0, 0, 0, 0));

    const data = await Options.aggregate([
      {
        $match: {
          $and: [
            {
              user: req.user._id,
            },
            {
              tradeCreatedOn: {
                $gte: week,
              },
            },
          ],
        },
      },
      {
        $project: {
          day: { $dayOfWeek: "$tradeCreatedOn" },
          netProfitLoss: 1,
        },
      },
      {
        $group: {
          _id: "$day",
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    console.log(day);
    const modData = data.sort((a, b) => {
      // a.day = day[a._id - 1];
      return a._id - b._id;
    });

    res.status(200).json({
      message: "sucess",
      modData,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
exports.getDataDayOfMonth = async (req, res) => {
  try {
    const daysIntoMonth = luxon.DateTime.local().day;
    const month = new Date(
      luxon.DateTime.local().minus({ days: daysIntoMonth })
    );
    // const userId = ObjectId.fromString( myObjectIdString );
    console.log(req.user._id);
    // console.log(month);
    const data = await Options.aggregate([
      {
        $match: {
          $and: [
            {
              user: req.user._id,
            },
            {
              tradeCreatedOn: {
                $gte: month,
              },
            },
          ],
        },
      },
      {
        $project: {
          dayOfTheMonth: { $dayOfMonth: "$tradeCreatedOn" },
          month: { $month: "$tradeCreatedOn" },
          netProfitLoss: 1,
          tradeCreatedOn: 1,
        },
      },
      {
        $group: {
          _id: { day: "$dayOfTheMonth", m: "$month" },
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    const modData = data.sort((a, b) => {
      console.log(a);
      return a._id.day - b._id.day;
    });
    console.log(modData);
    res.status(200).json({
      status: "success",
      modData,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getDataCustom = async (req, res) => {
  try {
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);

    const data = await Options.aggregate([
      {
        $match: {
          $and: [
            {
              user: req.user._id,
            },
            {
              tradeCreatedOn: {
                $gte: start,
                $lte: end,
              },
            },
          ],
        },
      },
      {
        $project: {
          tradeCreatedOn: 1,
          netProfitLoss: 1,
        },
      },
      {
        $group: {
          _id: "$tradeCreatedOn",
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    const modData = data.sort((a, b) => {
      const dateA = new Date(a._id);
      console.log(dateA);
      const dateB = new Date(b._id);
      return dateA - dateB;
    });
    res.status(200).json({
      status: "sucess",
      modData,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.tradeProfitLossBasedOnPremium = async (req, res) => {
  try {
    const { gt } = req.body;
    const { lt } = req.body;
    // const
    const data = await Options.aggregate([
      {
        $match: { user: req.user._id },
      },
      {
        $project: {
          totalPLBasedOnPremium: {
            $reduce: {
              input: "$leg",
              initialValue: 0,
              in: {
                $cond: [
                  {
                    $and: [
                      {
                        $gt: ["$$this.premium", gt],
                      },
                      {
                        $lt: ["$$this.premium", lt],
                      },
                    ],
                  },
                  {
                    $sum: "$$this.profitLoss",
                  },
                  null,
                ],
              },
            },
          },
        },
      },

      {
        $group: {
          _id: "Trades",
          totalPL: { $sum: "$totalPLBasedOnPremium" },
        },
      },
    ]);
    res.status(200).json({ status: "sucess", data });
  } catch (e) {
    console.log(e);
    res.status(400).json({ status: "failed", message: e });
  }
};

exports.getDatabasedOnCallPut = async (req, res) => {
  try {
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $unwind: "$leg",
      },
      {
        $project: {
          optionType: "$leg.optionType",
          profitLoss: "$leg.profitLoss",
        },
      },
      {
        $group: { _id: "$optionType", profitLoss: { $sum: "$profitLoss" } },
      },
    ]);

    res.status(200).json({
      status: "sucess",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getDataBasedOnTypeOfTrade = async (req, res) => {
  try {
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $unwind: "$leg",
      },
      {
        $project: {
          profitLoss: "$leg.profitLoss",
          typeOfTrade: "$leg.typeOfTrade",
        },
      },
      {
        $group: {
          _id: "$typeOfTrade",
          netProfitLoss: { $sum: "$profitLoss" },
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
      status: "faild",
      message: e,
    });
  }
};
exports.getDataBasedOnHoldingPeriod = async (req, res) => {
  try {
    const data = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $unwind: "$leg",
      },
      {
        $project: {
          heldDays: {
            $round: [
              {
                $divide: [
                  { $subtract: ["$leg.closeDate", "$leg.openDate"] },
                  1000 * 60 * 60 * 24,
                ],
              },
              0,
            ],
          },
          profitLoss: "$leg.profitLoss",
        },
      },
      {
        $group: {
          _id: "$heldDays",
          profitLoss: { $sum: "$profitLoss" },
        },
      },
    ]);
    res.status(200).json({ status: "sucess", data });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.findTradesByTicker = async (req, res) => {
  try {
    const query = req.body.underlying;
    query.trim();

    const rawData = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $addFields: {
          match: {
            $regexMatch: { input: "$underlying", regex: query, options: "i" },
          },
        },
      },
      {
        $group: {
          _id: "$match",
          result: {
            $push: "$$ROOT",
          },
        },
      },
    ]);
    const resultObj = rawData.find((el) => {
      return el._id === true;
    });
    const data = resultObj.result;
    console.log(data);
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getStratNames = async (req, res) => {
  try {
    const rawData = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $project: {
          strategyName: 1,
        },
      },
      {
        $group: {
          _id: "$strategyName",
        },
      },
    ]);
    const data = rawData.map((el) => {
      return {
        label: el._id,
        value: el._id,
      };
    });

    res.status(200).json({
      status: "Success",
      data,
    });
  } catch (e) {
    res.status(400).json({
      message: e,
      status: "success",
    });
  }
};

exports.strategyFilter = async (req, res) => {
  try {
    const { query } = req.body;
    const rawData = await Options.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $addFields: {
          match: {
            $regexMatch: {
              input: "$strategyName",
              regex: query,
              options: "i",
            },
          },
        },
      },
      {
        $group: {
          _id: "$match",
          results: {
            $push: "$$ROOT",
          },
        },
      },
    ]);
    const resultObj = rawData.find((el) => {
      return el._id === true;
    });

    const data = resultObj.results;
    res.status(200).json({
      status: "success",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTrade = await Options.findByIdAndDelete(id);
    console.log(deletedTrade);
    res.status(200).json({
      message: "success",
    });
  } catch (e) {
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};

exports.getProfitLoss = async (req, res) => {
  try {
    const { _id } = req.user;
    console.log(_id);
    const data = await Options.aggregate([
      {
        $match: {
          user: _id,
        },
      },
      {
        $group: {
          _id: "Profit Loss",
          profit: {
            $sum: {
              $cond: [
                {
                  $gt: ["$netProfitLoss", 0],
                },
                {
                  $sum: "$netProfitLoss",
                },
                null,
              ],
            },
          },
          loss: {
            $sum: {
              $cond: [
                {
                  $lt: ["$netProfitLoss", 0],
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
    res.status(200).json({
      data,
      status: "success",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: e,
      status: "failed",
    });
  }
};
