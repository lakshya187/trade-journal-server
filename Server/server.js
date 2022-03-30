const mongoose = require("mongoose");
const app = require(`${__dirname}/app`);

//The connect string responsible to establish connection between mongoDB and the code.
const connectStr = `mongodb+srv://lakshya187:jc522066y@cluster0.xb1zq.mongodb.net/Trade_journal?retryWrites=true&w=majority`;

mongoose
  .connect(connectStr, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connection to the database was successful"));

const port = 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
