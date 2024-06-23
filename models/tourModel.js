const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: {
        values: true,
        message: 'Name field is required',
      },
      unique: true,
      minlength: 5,
      maxlength: 50,
      trim: true,
    },
    slug: String,
    price: {
      type: Number,
      required: [true, 'Price field is required.'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1.0,
      max: 5.0,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Tour = mongoose.model('Tour', tourSchema);

tourSchema.virtual('halfPrice').get(function () {
  return this.price / 2;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

tourSchema.pre(/^find/, function (next) {
  this.populate('reviews');
  next();
});

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = Tour;
