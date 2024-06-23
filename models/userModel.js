const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter you name."],
  },
  email: {
    type: String,
    required: [true, "Email is a required field."],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email."],
  },
  photo: String,
  role: {
    type: String,
    default: "user",
    enum: {
      values: ["user", "guide", "lead-guide", "admin"],
      message:
        "You can only specify value for role: user, guide, lead-guide, admin",
    },
  },
  password: {
    type: String,
    required: [true, "Password is a required field."],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not matching.",
    },
  },
  changePasswordAfter: Date,
  passwordRestToken: String,
  passwordRestTokenExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.changePasswordAfter = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.checkPasswordChange = function (JWTTimeStamp) {
  if (this.changePasswordAfter) {
    const timeStamp = parseInt(this.changePasswordAfter.getTime() / 1000, 10);
    return JWTTimeStamp < timeStamp;
  }
  return false;
};

userSchema.methods.createPasswordRestToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordRestToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordRestTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
