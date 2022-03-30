const express = require("express");
const app = express();
const tradeRouter = require(`${__dirname}/routes/tradeRoutes`);
app.use(express.json());

app.use("/trades", tradeRouter);

module.exports = app;
