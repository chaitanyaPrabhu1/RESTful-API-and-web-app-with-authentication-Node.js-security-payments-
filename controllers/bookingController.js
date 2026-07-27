const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../utils/handlerFactory');

exports.createBooking = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.body.tour);
  if (!tour) {
    return next(new AppError('no tour found with that ID', 404));
  }

  if (!req.body.startDate) {
    return next(new AppError('a booking must have a start date', 400));
  }

  // price always comes from the tour itself, never trust a client-supplied price
  const booking = await Booking.create({
    tour: tour.id,
    user: req.user.id,
    price: tour.price,
    startDate: req.body.startDate
  });

  res.status(201).json({
    status: 'success',
    data: { data: booking }
  });
});

exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { data: bookings }
  });
});

exports.cancelMyBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!booking) {
    return next(new AppError('no booking found with that ID', 404));
  }

  booking.status = 'cancelled';
  await booking.save();

  res.status(200).json({
    status: 'success',
    data: { data: booking }
  });
});

// admin-only
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
