const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./../utils/handlerFactory');

// this is model of the schema, and its a class made by the mongoose

exports.aliasTopTours = (req, res, next)=>{
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

/*
Tour.aggregate([
  stage1,   // all documents go in here
  stage2,   // whatever stage1 outputs goes in here
  stage3    // whatever stage2 outputs comes out at the end
]);


{ $match: { ... } }   // filter documents (like a WHERE clause)
{ $group: { ... } }   // bundle documents together and calculate stuff
{ $sort:  { ... } }   // reorder documents

{ $match: ... }        // $match is a command
{ $gte: 4.5 }          // $gte is an operator: "greater than or equal"
{ $avg: ... }          // $avg is an operator: "average these"
*/

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }   // its like a where clause
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum:1 },
        numRating: { $sum: '$ratingsQuantity'},
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price'}
      }
    },
    {
      $sort: {avgPrice: 1}
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});
