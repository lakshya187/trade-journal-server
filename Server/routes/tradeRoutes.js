const express = require("express");
const tradeControllers = require("./../controllers/tradeControllers");
const authController = require("./../controllers/authController");
const multer = require("multer");
const saltedMd5 = require("salted-md5");
const path = require("path");
const admin = require("firebase-admin");

const upload = multer({ dest: `${__dirname}/../excelUploads` });
require("dotenv").config();

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./excelUploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}__${file.originalname}`);
  },
});

const router = express.Router();

router
  .route("/getStats")
  .get(authController.protect, tradeControllers.getStats);
router.route("/updateClosing/:id").patch(tradeControllers.updateClosingEnties);
router.post(
  "/uploadExcel",
  authController.protect,
  upload.single("file"),
  tradeControllers.uploadExcelTrades
);
router
  .route("/")
  .get(authController.protect, tradeControllers.getAllTrades)
  .post(authController.protect, tradeControllers.createTrade);

router
  .route("/:id")
  .get(tradeControllers.getSingleTrade)
  .patch(tradeControllers.updateTrade)
  .delete(tradeControllers.deleteTrade);
module.exports = router;
