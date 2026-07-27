const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'a booking must belong to a tour']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'a booking must belong to a user']
  },
  price: {
    type: Number,
    required: [true, 'a booking must have a price']
  },
  startDate: {
    type: Date,
    required: [true, 'a booking must have a start date']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookingSchema.pre(/^find/, function() {
  this.populate('user').populate({
    path: 'tour',
    select: 'name price imageCover startDates'
  });
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
