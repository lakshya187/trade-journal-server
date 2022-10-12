const ticker = require("../controllers/tickerController");
const express = require("express");
const multer = require("multer");

const upload = multer({ dest: `${__dirname}/../excelUploads` });

const router = express.Router();

// router.post("/", ticker.createTickers);
router.get("/", ticker.getTickers);

module.exports = router;
