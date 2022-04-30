const express = require("express");
const authController = require("./../controllers/authController");
const userController = require("../controllers/userController");

const router = express.Router();
router.post("/sign-up", authController.signUp);
router.post("/log-in", authController.login);
router.post("/authorize", authController.authorize);

router.get("/:id", userController.getSingleUser);
module.exports = router;
