const catchAsync = require('./../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factoryController = require('./factoryController');

exports.createFilter = (req, res, next) => {
  req.query.tour = req.params.tourId;
  next();
};
exports.addIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.setId = (req, res, next) => {
  req.params.id = req.params.tourId;
  next();
};

exports.getAllReviews = factoryController.getAll(Review);
exports.createReview = factoryController.createOne(Review);
exports.getReview = factoryController.getOne(Review);
exports.updateReview = factoryController.updateOne(Review);
exports.deleteReview = factoryController.deleteOne(Review);
