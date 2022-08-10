const { protect } = require("../controllers/authController");
const combinedAnalysis = require("../controllers/combinedAnalysis");
const express = require("express");
const router = express.Router();

router.get("/getReturns", protect, combinedAnalysis.returns);

module.exports = router;
