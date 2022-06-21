const express = require("express");
const authController = require("../controllers/authController");
const optionsController = require("../controllers/optionsController");

const router = express.Router();
router.patch(
  "/updateClosing/:id",
  authController.protect,
  optionsController.updateClosingLeg
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

module.exports = router;
