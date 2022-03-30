const express = require("express");
const tradeControllers = require("./../controllers/tradeControllers");

const router = express.Router();
router
  .route("/")
  .get(tradeControllers.getAllTrades)
  .post(tradeControllers.createTrade);

router
  .route("/:id")
  .get(tradeControllers.getSingleTrade)
  .patch(tradeControllers.updateTrade)
  .delete(tradeControllers.deleteTrade);
module.exports = router;
