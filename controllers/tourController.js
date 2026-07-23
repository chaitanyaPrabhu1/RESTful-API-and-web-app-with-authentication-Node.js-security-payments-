const Tour = require('../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError')
// this is model of the schema, and its a class made by the mongoose

// const tours = JSON.parse(
//  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );


const APIFeatures = require('./../utils/apiFeatures');

exports.aliasTopTours = (req, res, next)=>{
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};


/*
Tour is model class, if the do Tour.find(), we get query object and 
we can still do the chaining, but once we await it, we get a array of documents.
*/





exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const allTours = await features.query;

  res.status(200).json({
    status: 'success',
    results: allTours.length,
    data: { allTours }
  });
});





/*
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  }
};


exports.getTour = (req, res, next) => {
  fn(req, res, next).catch(err => next(err));
};


get tour look like, 

getTour = (req, res, next) => {
  (async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return next(new AppError('no tour found', 404));
    }
    res.status(200).json({ status: 'success', data: { tour } });
  })(req, res, next).catch(err => next(err));
};
*/


exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  if(!tour){
    return next(new AppError('no tour found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});



// fn will be passed by the req, res, next parameter
// the req, res, next is getting captured and when called
// will run fn with those parameter.



// what ever which is inside the fn
// fn is the async(req, res) function
exports.createTour = catchAsync(async(req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if(!tour){
    return next(new AppError('no tour found', 404));
  }
  res.status(201).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  // Check if tour was actually found and deleted
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'No tour found with that ID'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});


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



