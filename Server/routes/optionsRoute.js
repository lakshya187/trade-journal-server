const express = require("express");
const authController = require("../controllers/authController");
const optionsController = require("../controllers/optionsController");
const optionsStratLevelAnalysis = require("../controllers/optionAnalysisStratLevel");
const router = express.Router();
router.patch(
  "/updateClosing/:id",
  authController.protect,
  optionsController.updateClosingLeg
);
router.patch(
  "/updateClosingStrat/:id",
  authController.protect,
  optionsController.updateClosingStrat
);
router.get(
  "/getProfitLossTypeOfTradeStrat",
  authController.protect,
  optionsStratLevelAnalysis.getProfitLossTypeOfTrade
);
router.get(
  "/getProfitLossExpire",
  authController.protect,
  optionsStratLevelAnalysis.getProfitLossDaysToExpire
);
router.post(
  "/getProfitLossHoldingPeroid",
  authController.protect,
  optionsController.getDataBasedOnHoldingPeriod
);
router.get("/", authController.protect, optionsController.getAllOptions);
router.post("/", authController.protect, optionsController.createOptionTrades);

router.get(
  "/getProfitLossTypeOfTrade",
  authController.protect,
  optionsController.getDataBasedOnTypeOfTrade
);
router.get("/:id", authController.protect, optionsController.getSingleOption);
router.post(
  "/getAnalytics",
  authController.protect,
  optionsController.getAnalytics
);
router.post(
  "/getDataMonthly",
  authController.protect,
  optionsController.getDataMonth
);
router.post(
  "/getDataYearly",
  authController.protect,
  optionsController.getDataYear
);
router.post(
  "/getDataWeekly",
  authController.protect,
  optionsController.getDataWeekly
);
router.post(
  "/getDataCustom",
  authController.protect,
  optionsController.getDataCustom
);
router.post(
  "/getProfitLossPremium",
  authController.protect,
  optionsController.tradeProfitLossBasedOnPremium
);
router.post(
  "/getProfitLossOptionType",
  authController.protect,
  optionsController.getDatabasedOnCallPut
);
router.post(
  "/getProfitLossPremiumStrat",
  authController.protect,
  optionsStratLevelAnalysis.getProfitLossPremium
);

module.exports = router;
