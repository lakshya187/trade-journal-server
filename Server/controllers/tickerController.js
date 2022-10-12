const xlsx = require("xlsx");
const fs = require("fs");
const Ticker = require("../models/stockTicker");
const tikcerData = fs.readFileSync(`${__dirname}/../csvjson.json`);

exports.createTickers = async (req, res) => {
  try {
    const data = JSON.parse(tikcerData);
    console.log(data);
    const uploadedData = await Ticker.insertMany(data);
    console.log(uploadedData);
    res.status(200).json({
      message: "success",
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "failed",
    });
  }
};

exports.getTickers = async (req, res) => {
  try {
    const { query } = req.query;
    const data = await Ticker.find({
      companyName: { $regex: query, $options: "i" },
    }).limit(5);
    res.status(200).json({
      message: "success",
      data,
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "failed",
    });
  }
};
