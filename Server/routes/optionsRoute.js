const express = require("express");
const authController = require("../controllers/authController");
const optionsController = require("../controllers/optionsController");

const router = express.Router();
router.get("/", authController.protect, optionsController.getAllOptions);
router.post("/", authController.protect, optionsController.createOptionTrades);
router.patch(
  "/updateClosing/:id",
  authController.protect,
  optionsController.updateClosingLeg
);
router.get("/:id", authController.protect, optionsController.getSingleOption);
module.exports = router;
