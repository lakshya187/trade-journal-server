const express = require("express");
//importing the trade model. Which is built using mongoose and therefore has all the methods for querying insdie database
const Trade = require(`./../models/tradeModel`);
const User = require("./../models/userModel.js");

exports.getAllTrades = async (req, res) => {
  try {
    // console.log(req.user.id);
    // const trades = await Trade.aggregate([
    //   {
    //     $documents: {
    //       user: "626683ae8895262abfbd4a84",
    //     },
    //   },
    // ]);
    //   .populate("allTrades")
    // const user = await User.aggregate([
    //   { $match: { _id: req.user.id } },
    //   {
    //     $addFields: {
    //       show: true,
    //     },
    //   },
    // ]);
    const user = await User.findById(req.user.id).populate({
      path: "allTrades",
      options: {
        sort: { openDate: -1 },
        skip: 0,
        limit: 10,
      },
      match: {},
    });

    // console.log(user);

    res.status(200).json({
      message: "Success",
      data: {
        trades: user.allTrades,
      },
    });
  } catch (err) {
    console.log(err);
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
    console.log(err);
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
    //Allow nested routes

    if (!req.body.user) {
      req.body.user = req.user.id;
    }
    const newTrade = await Trade.create(req.body);
    res.status(201).json({
      message: "Sucess",
      data: {
        newTrade,
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
exports.updateClosingEnties = async (req, res) => {
  try {
    console.log(typeof req.body.data.price);
    //Getting the document
    const currentDocument = await Trade.findById(req.params.id);
    //calculating the updaed vcalue
    //Pirce : 20,quantity :10
    const currHoldings =
      currentDocument.currentHoldings - +req.body.data.quantity;
    if (currHoldings <= -1) {
      throw new Error("you cant close the trade with this amount");
    }
    //creating the updaed object
    const updatedHoldings = { currentHoldings: currHoldings };
    //Updating the object
    const updatedCurrentHolding = await Trade.findByIdAndUpdate(req.params.id, {
      $set: updatedHoldings,
    });
    //Creating  a new close trade entry
    const closingTradeEntry = {
      ...req.body.data,
      weight: req.body.quantity * req.body.price,
    };
    console.log(closingTradeEntry);
    const updatedTrade = await Trade.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          closingEntries: {
            ...req.body.data,
          },
        },
      },
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

exports.updateCurrentHoldings = function (req, res) {
  try {
    console.log(this);
    res.status(200).json({
      status: "Sucess",
      message: "The trade has been updaed sucessfully",
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: sucess });
  }
};
