const express = require("express");
const xlsx = require("xlsx");
const fs = require("fs");

const Trade = require(`./../models/tradeModel`);
const User = require("./../models/userModel.js");

exports.getAllTrades = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "allTrades",
      options: {
        sort: { openDate: -1 },
        skip: 0,
        limit: 100,
      },
      match: {},
    });
    res.status(200).json({
      message: "success",
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
    // console.log(err);
    res.status(400).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.updateTrade = async (req, res) => {
  // console.log(req.params.id, req.body);
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
    // console.log(err);
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
exports.createTrade = async (req, res) => {
  try {
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
    const currentDocument = await Trade.findById(req.params.id);

    const currHoldings =
      currentDocument.currentHoldings - +req.body.data.quantity;
    if (currHoldings <= -1) {
      throw new Error("you cant close the trade with this amount");
    }

    const newEntires = [req.body.data, ...currentDocument.closingEntries];
    let val = 0;
    newEntires.forEach((el) => {
      const { price, quantity } = el;
      val += price * quantity;
    });
    let pl;
    const closePriceCal = val / currentDocument.tradeQuantity;
    if (currentDocument.typeOfTrade === "short") {
      pl =
        (currentDocument.openPrice - closePriceCal) *
        currentDocument.tradeQuantity;
    } else {
      pl =
        (closePriceCal - currentDocument.openPrice) *
        currentDocument.tradeQuantity;
    }

    const updatedTrade = await Trade.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          closingEntries: {
            ...req.body.data,
          },
        },
        $set: {
          currentHoldings: currHoldings,
          closingPriceCalculated: closePriceCal,
          profitLoss: pl.toFixed(1),
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
    res.status(200).json({
      status: "Sucess",
      message: "The trade has been updaed sucessfully",
    });
  } catch (err) {
    res.status(401).json({ message: sucess });
  }
};

exports.uploadExcelTrades = async (req, res) => {
  try {
    const { _id } = req.user;
    const { filename } = req.file;
    console.log(req.file);

    const workBook = xlsx.readFile(`${__dirname}/../excelUploads/${filename}`);
    const sheetNames = workBook.SheetNames[0];
    const sheetValues = workBook.Sheets[sheetNames];
    const jsonData = xlsx.utils.sheet_to_json(sheetValues);
    const modData = jsonData.map((t) => {
      const tyoeOfTrade = t.tradeQuantity >= 0 ? "Long" : "Short";
      t.typeOfTrade = tyoeOfTrade;
      t.tradeQuantity = Math.abs(t.tradeQuantity);
      t.currentHoldings = 0;
      t.user = _id;
      const closingEntry = { price: t.closePrice, quantity: t.tradeQuantity };
      t.closingEntries = [];
      t.closingEntries.push(closingEntry);
      t.closingPriceCalculated = t.closePrice;
      t.profitLoss = +((t.closePrice - t.openPrice) * t.tradeQuantity).toFixed(
        2
      );
      return t;
    });
    console.log(modData);
    const newTrades = await Trade.insertMany(modData);
    fs.unlink(`${__dirname}/../excelUploads/${filename}`, (err) => {
      if (err) console.log(err);
      console.log(`${filename} succesfully parsed and removed.`);
    });

    res.status(201).json({
      status: "sucess",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "failed", message: err });
  }
};

exports.getStats = async (req, res, next) => {
  const user = req.user._id;
  const data = await Trade.aggregate([
    {
      $match: {
        user: user,
      },
    },
    {
      $group: {
        _id: "Stats",
        totalTrades: { $sum: 1 },
        totalAmountInvested: {
          $sum: { $multiply: ["$openPrice", "$tradeQuantity"] },
        },
        totalProfit: {
          $sum: {
            $cond: [{ $gt: ["$profitLoss", 0] }, { $sum: "$profitLoss" }, null],
          },
        },
        totolLoss: {
          $sum: {
            $cond: [{ $lt: ["$profitLoss", 0] }, { $sum: "$profitLoss" }, null],
          },
        },
        profitTrades: {
          $sum: {
            $cond: [{ $gt: ["$profitLoss", 0] }, 1, 0],
          },
        },
        lossTrades: {
          $sum: {
            $cond: [{ $lt: ["$profitLoss", 0] }, 1, 0],
          },
        },
      },
    },
  ]);

  console.log(data);

  res.status(200).json({
    message: "Success",
    data: {
      trades: data,
    },
  });
};
