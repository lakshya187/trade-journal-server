const mongoose = require("mongoose");
const bycrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Provide an email"],
      lowercase: true,
    },
    confirmPassword: {
      type: String,
      required: true,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
      },
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;
  this.password = await bycrypt.hash(this.password, 12);
  this.confirmPassword = undefined;

  next();
});

//Virtual populate to create a new virtual property to have all the trades the user created
userSchema.virtual("allTrades", {
  ref: "Trade",
  localField: "_id",
  foreignField: "user",
});

//Instance method to check if the password was changed after the token was issued
userSchema.methods.compareTimestamps = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const timeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return timeStamp > jwtTimeStamp;
  }
  return false;
};
//instance method to check if the passswords match
userSchema.methods.checkPasswords = async function (reqPassword, userPassword) {
  return await bycrypt.compare(reqPassword, userPassword);
};
// userSchema.pre("find", function (next) {
//   console.log("working");
//   this.populate("allTrades");
//   next();
// });
const User = mongoose.model("user", userSchema);

module.exports = User;
