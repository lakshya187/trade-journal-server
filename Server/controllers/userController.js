const express = require("express");
const User = require("./../models/userModel");

exports.getSingleUser = async (req, res, next) => {
  //   console.log(req.params.id);
  try {
    const user = await User.findById(req.params.id).populate({
      path: "allTrades",
      options: {
        sort: { openDate: 1 },
        skip: 0,
        limit: 3,
      },
      match: {},
    });
    if (!user) {
      throw new Error("user not found");
    }
    res.status(200).json({
      status: "Sucess",
      data: {
        user,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "Failed",
      message: err,
    });
  }
};
