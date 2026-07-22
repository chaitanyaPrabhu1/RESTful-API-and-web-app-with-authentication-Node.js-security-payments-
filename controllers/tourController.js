const Tour = require('./../models/tourmodel');
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

exports.getAllTours = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};




exports.getTour = async (req, res) => {
  try{
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: {
        tour
      }
    })
  }catch(err){
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  } 
};



const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  }
};

// what ever which is inside the fn
// fn is the async(req, res) function
exports.createTour = catchAsync(async(req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = async(req, res) => {
  try{
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(201).json({
      status: 'success',
      data: {
        tour
      }
    });
  }catch(err){
    res.status(500).json({
      status: 'fail',
      err: err.message
    })
  }
};

exports.deleteTour = async(req, res) => {
  try {
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
  } catch(err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
};


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



exports.getTourStats = async (req, res) => {
  try {
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
      data: { stats }   // ← fixed: data
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};



