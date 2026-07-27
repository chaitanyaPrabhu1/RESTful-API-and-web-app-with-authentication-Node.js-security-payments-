const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'a review can not be empty']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'a review must have a rating']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'a review must belong to a tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'a review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// one review per user per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function() {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
});

// recalculate the parent tour's ratingsAverage / ratingsQuantity
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // this.constructor points to the Review model (Review isn't defined yet at this point in the file)
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate / findByIdAndDelete on reviews also need to trigger a
// recalculation - pass the doc from pre to post via `this`
reviewSchema.pre(/^findOneAnd/, async function() {
  this.reviewDoc = await this.findOne();
});

reviewSchema.post(/^findOneAnd/, async function() {
  if (this.reviewDoc) await this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
