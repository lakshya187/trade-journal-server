const express = require("express");
const morgan = require("morgan");
const swaggerJsDocs = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");

const tradeRouter = require(`${__dirname}/routes/tradeRoutes`);
const userRouter = require("./routes/userRoute");

const app = express();
app.use(express.json());
app.use(cors());

app.use(morgan("dev"));
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Trade Journal",
      description: "Journal your trades",
      servers: ["http://localhost:5000"],
    },
  },
  apis: ["./routes/tradeRoutes.js"],
};
const swaggerDocs = swaggerJsDocs(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use("/trades", tradeRouter);
app.use("/users", userRouter);
module.exports = app;
