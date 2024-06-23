const AppError = require("./../utils/app-error");

const sendCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const sendValidationErrorDB = (err) => {
  const errors = Object.keys(err)
    .map((el) => el.message)
    .join(". ");
  const message = `Please make sure you send out these fields. ${errors}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: err.status,
      message: "Something went very wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    const error = { ...err };
    if (error.name === "CastError") error = sendCastErrorDB(error);
    if (error.name === "ValidationError") error = sendValidationErrorDB(error);
    sendErrorProd(error, res);
  }
};
