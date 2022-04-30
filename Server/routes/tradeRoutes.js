const express = require("express");
const tradeControllers = require("./../controllers/tradeControllers");
const authController = require("./../controllers/authController");

/**
 * @swagger
 * /
 *  get:
 *    summary : This endpoint is to get all the trades.
 *    description : Use to request all the trades.
 *    responses :
 *        200:
 *            description : To test the get method
 *
 */

/**
 * @swagger
 * /:
 *  post:
 *    summary : This endpoint is to create new trades.
 *    description : expecting data in the format.
 *    parameters: [stockTicker : string]
 *    responses :
 *        201:
 *            description : To test the post method
 *
 */
/**
 * @swagger
 * /id:
 *  patch:
 *    summary : This endpoint is to update trades.
 *    description : expecting data in the format.
 *
 *    responses :
 *        202:
 *            description : To test the patch method
 *
 */

/**
 * @swagger
 * /id:
 *  delete:
 *    summary : This endpoint is to delete trades.
 *    description : enter add the trade id.
 *
 *    responses :
 *        203:
 *            description : To test the delete method
 *
 */
/**--++
 * @swagger
 * /id:
 *  get:
 *    summary : This endpoint is get a single trade.
 *    description : expecting data in the format.
 *
 *    responses :
 *        200:
 *            description : To test the get method
 *
 */
const router = express.Router();
router.route("/updateClosing/:id").patch(tradeControllers.updateClosingEnties);

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
