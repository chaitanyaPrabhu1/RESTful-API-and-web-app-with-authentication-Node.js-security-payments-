const Tour = require('./../models/tourmodel');



// const tours = JSON.parse(
//  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );




exports.getAllTours = async(req, res) => {
  // console.log(req.query);
  try{

    
    // 1A) filtering-basic
    // making a hard copy, else there will be just a shallow copy

    // first build the query, then execuate the query 
    const queryObj = {...req.query};
    const excludedFields = ['page', 'sort', 'fields', 'limit'];
    // remove this from the objects.
    excludedFields.forEach(el=> delete queryObj[el]);

    // 1B) Advance filtering
    // { difficulty = easy, duration: {$gte: 5}}

    const queryStr = JSON.stringify(queryObj).replace(
    /\b(gte|gt|lte|lt)\b/g,
    match => `$${match}`
    );
    // gte, gt, lte, lt


    let query = Tour.find(JSON.parse(queryStr));
    // Tour.find() returns the query, so we can keep chaining

    // 2) sorting
    if(req.query.sort){
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    }else{
      query = query.sort('-createdAt');
    }

    // 3) fields limiting(limiting what should be showed)
    if(req.query.fields){
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    }else{
      // removing __v field
      query = query.select('-__v');
    }


    const allTours = await query;
    res.status(200).json({
      status: 'success',
      result: allTours.length,
      data: {
        allTours
      }
    });
  }catch(err){
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
