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

exports.createTour = async(req, res) => {
  try{
    const newTour = await Tour.create(req.body);
    res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
    });
  }catch(err){
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

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
