const express = require("express");
//importing the trade model. Which is built using mongoose and therefore has all the methods for querying insdie database
const Trade = require(`./../models/tradeModel`);

exports.getAllTrades = async (req, res) => {
  try {
    const allTrades = await Trade.find();
    res.status(200).json({
      message: "Success",
      data: {
        trades: allTrades,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};
exports.getSingleTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    res.status(200).json({
      message: "Sucess",
      data: {
        trade,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.updateTrade = async (req, res) => {
  console.log(req.params.id, req.body);
  try {
    const updatedTrade = await Trade.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      message: "Success",
      data: {
        updatedTrade,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
exports.createTrade = async (req, res) => {
  try {
    const newTrade = await Trade.create(req.body);
    res.status(201).json({
      message: "Sucess",
      data: {
        newTrade,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    const deletedTrade = await Trade.findByIdAndDelete(req.params.id);
    res.status(204).json({
      message: "Success",
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
