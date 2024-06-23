const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");
const AppError = require("./../utils/app-error");
const { message } = require("prompt");

const signInToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendCreateToken = (user, statusCode, res) => {
  const token = signInToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });
  const token = signInToken(user._id);
  sendCreateToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password.", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(
      new AppError("No user with the give email and password found.", 400)
    );
  }
  sendCreateToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("Please login to get access to this resourse", 400)
    );
  }
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const user = await User.findById(decode.id);
  if (!user) {
    return next(new AppError("No user with the given token exit.", 400));
  }
  if (user.checkPasswordChange(decode.iat)) {
    return next(
      new AppError(
        "User has recently changed it's password. Please login to get access to this resource",
        403
      )
    );
  }
  req.user = user;
  next();
});

exports.restrictTo = (...options) => {
  return catchAsync((req, res, next) => {
    if (!options.includes(req.user.role)) {
      return next(
        new AppError("You do not have access to this resource.", 403)
      );
    }
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Please provide your email", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user with the given email found", 400));
  }
  const resetToken = user.createPasswordRestToken();
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forget you password? Please send your password and passwordConfirm at ${resetUrl}`;
  try {
    res.status(200).json({
      status: "success",
      time: "10 minutes",
      message,
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordRestTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      status: "error",
      message: "Something went wrong.",
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;
  const hash = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordRestToken: hash,
    passwordRestTokenExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new AppError("Token has been expired. Please get token again", 400)
    );
  }
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordRestToken = undefined;
  user.passwordRestTokenExpires = undefined;
  await user.save();
  res.status(200).json({
    status: "success",
    message: "Password reset successflly.",
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm, passwordCurrent } = req.body;
  if (!password && !passwordConfirm && !passwordCurrent) {
    return next(
      new AppError(
        "Please provide passwordCurrent, password and passwordCondirm",
        400
      )
    );
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError("Password is incorrect.", 400));
  }
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  sendCreateToken(user, 200, res);
});
