const twitter = require("../controllers/twitterController");
const express = require("express");
const { options } = require("./tradeRoutes");

const router = express.Router();
router.post("/generateSignature", twitter.generateSignature);
router.post("/verifyToken", twitter.verifyToken);
router.post("/tweetImage", twitter.tweetImage);
module.exports = router;
