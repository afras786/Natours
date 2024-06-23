const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review is a required field.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

reviewSchema.pre(/^find/, function (next) {
  this.populate('tour').populate('user');
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
