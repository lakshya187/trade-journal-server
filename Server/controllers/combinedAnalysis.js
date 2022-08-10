const express = require("express");
const Equity = require("../models/tradeModel");
const Options = require("../models/optionsModel");

const router = express.Router();

exports.returns = (req, res) => {
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
