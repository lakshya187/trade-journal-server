const express = require("express");
const morgan = require("morgan");
const swaggerJsDocs = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors");
const compression = require("compression");
const multer = require("multer");
const { engine } = require("express-handlebars");
const path = require("path");

const tradeRouter = require(`${__dirname}/routes/tradeRoutes`);
const userRouter = require("./routes/userRoute");
const optionsRouter = require("./routes/optionsRoute");
const thirdPartyRouter = require("./routes/thirdPartyRoutes");
const app = express();
process.env.SRC_PATH = path.resolve(__dirname);
app.use(express.json());
app.set("view engine", "hbs");
app.engine(
  "hbs",
  engine({ layoutDir: `${__dirname}/views/layouts`, extname: "hbs" })
);
app.use(cors());
app.use(compression());
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
app.use("/options", optionsRouter);
app.use("/users", userRouter);
app.use("/oAuth", thirdPartyRouter);
module.exports = app;
