const jwt = require("jsonwebtoken");
const { decode } = require("punycode");
const { promisify } = require("util");

const User = require("../models/userModel");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signUp = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      // passwordChangedAt: req.body.passwordChangedAt,
    });
    const token = generateToken(newUser._id);
    res.status(201).json({
      status: "Sucess",
      token,
      user: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //Check if the credentials are actually presnet
    if (!email || !password) {
      throw new Error("Passowrd or email does not exsists");
    }
    //Check if the email matches with a user
    const user = await User.findOne({ email }).select("+password");
    //Check passwords
    const compare = await user.checkPasswords(password, user.password);
    if ((!user, !compare)) {
      throw new Error("Password you entered does not match");
    }
    //Generate token
    const token = generateToken(user._id);
    res.status(200).json({
      status: "sucess",
      token: token,
      user: user,
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "Failed",
      message: err,
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Checking if the token is present insdie the header
    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw new Error("You should login first");
    }
    //2) Validating the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded) {
      throw new Error("The user is not vaild");
    }
    //3) Checking if the user exsists
    const currentUser = await User.findById(decoded.id);

    //4) Checking if the password was changed before the token was issued.
    // console.log(currentUser.compareTimestamps(decoded.iat));
    if (currentUser.compareTimestamps(decoded.iat)) {
      throw new Error("password was changed recently, please login again");
    }
    req.user = currentUser;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "failed",
      message: err,
    });
  }
};

exports.authorize = async (req, res) => {
  try {
    console.log(req.headers);
    console.log("working");
    // console.log(req.headers);
    //1) Check if the token exsists insdie the header
    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      throw new Error("You should login first");
    }
    console.log(token);
    //2) Check if the token is vailed
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (!decoded) {
      throw new Error("The token is invaild");
    }
    //3) Check if the user exsists
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error("The user does not exsists");
    }
    console.log(user);
    //4) Check if the password was changed afetr the token was issued
    if (user.compareTimestamps(decoded.iat)) {
      throw new Error("password was recently changed");
    }
    res.status(200).json({
      message: "Sucess",
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(401).json({
      status: "Failed",
      message: "invailed token",
    });
  }
};
