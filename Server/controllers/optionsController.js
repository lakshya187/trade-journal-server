const luxon = require("luxon");
const express = require("express");
const Options = require("../models/optionsModel");
const User = require("../models/userModel");
const { months } = require("../utils/staticData");
const mongoose = require("mongoose");

exports.getAllOptions = async (req, res, next) => {
  try {
    const options = await User.findById(req.user.id).populate({
      path: "allOptionsTrade",
      options: {
        sort: { openDate: -1 },
        skip: 0,
        limit: 100,
      },
      match: {},
    });
    res.status(200).json({
      status: "success",
      data: options,
    });
  } catch (e) {
    console.log(e);
    res.status(401).json({
      status: "failed",
      message: e,
    });
  }
};
exports.createOptionTrades = async (req, res) => {
  try {
    if (!req.body.user) {
      req.body.user = req.user.id;
    }
    req.body.leg.forEach((l, i) => {
      l.currentHoldings = l.quantity * l.lotSize;
    });
    console.log(req.body);
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
      return (l.srtike = strike && l.optionType === optionType);
    });
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
    console.log(leg);
    // console.log(leg);

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

exports.getSingleOption = async (req, res) => {
  try {
    const trade = await Options.findById(req.params.id);
    res.status(200).json({
      message: "sucess",
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
        .minus({ hour: currentDate.getHours() })
        .toISO()
    );
    const daysIntoMonth = currentDate.getDate() - 1;
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
    console.log(day);
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
                _id: "Stats",
                totalTrades: {
                  $sum: 1,
                },
                netPLDay: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          {
                            $gte: ["$tradeCreatedOn", day],
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
                netPLWeek: {
                  $sum: {
                    $cond: [
                      {
                        $and: [{ $gte: ["$tradeCreatedOn", week] }],
                      },
                      { $sum: "$netProfitLoss" },
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
                netPLInTotal: { $sum: "$netProfitLoss" },
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
            {
              $group: {
                _id: "Average Holding Period",
                value: { $avg: "$heldDays" },
              },
            },
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
  const start = new Date(req.body.start);
  const end = new Date(req.body.end);

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
          _id: { month: "$month" },
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    res.status(200).json({
      status: "Sucess",
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
          _id: { day: "$day" },
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    res.status(200).json({
      message: "sucess",
      data,
    });
  } catch (e) {
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
          year: { $year: "$tradeCreatedOn" },
          month: { $month: "$tradeCreatedOn" },
          netProfitLoss: 1,
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          netProfitLoss: { $sum: "$netProfitLoss" },
        },
      },
    ]);
    const modData = data.map((el) => {
      el._id.month = months[el._id.month];
      return el;
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
