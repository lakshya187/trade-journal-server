const mongoose = require("mongoose");
const app = require(`${__dirname}/app`);
const morgan = require("morgan");
const dotenv = require("dotenv");
app.use(morgan("dev"));

dotenv.config({ path: `${__dirname}/config.env` });
//The connect string responsible to establish connection between mongoDB and the code.
mongoose
  .connect(
    process.env.MONGODB_CONNECT_STRING.replace(
      "<PASSWORD>",
      process.env.PASSWORD
    ),
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Connection to the database was successful"));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
