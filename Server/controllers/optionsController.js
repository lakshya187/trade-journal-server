const express = require("express");
const Options = require("../models/optionsModel");
const { off } = require("../models/tradeModel");
const Trade = require("../models/tradeModel");
const User = require("../models/userModel");

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

    //Pushing closing entries
    const { optionType } = req.body;
    const { strike } = req.body;
    const { data } = req.body;
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
    currentTrade.netProfitLoss = pAndL;
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
    res.status(400).json({
      status: "failed",
      message: e,
    });
  }
};
