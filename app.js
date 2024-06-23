const express = require("express");
const tourRouter = require("./routes/tourRoute");
const userRouter = require("./routes/userRoute");
const AppError = require("./utils/app-error");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const globalErrorHandler = require("./controllers/errorController");

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests. Please try again with an hour.",
});

const app = express();
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ["name", "price", "createAt", "rating"],
  })
);
app.use(limiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.static(`${__dirname}/public`));
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`No route at ${req.originalUrl} exists`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
