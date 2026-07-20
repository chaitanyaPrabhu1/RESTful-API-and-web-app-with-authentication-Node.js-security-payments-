const mongoose = require('mongoose');


//**********************************this contains the bussiness logic*****************************************************

// making schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true
  },
  duration:{
    type: Number,
    required: [true, 'A tour must have aduration']
  },
  maxGroupSize:{
    type: Number,
    required: [true, ' a grp must have a group size']
  },
  difficulty :{
    type: String,
    required: [true, 'a tour should have difficulty']
  },
  ratingsAverage: {
    type: Number,
    default: 4.5
  },
  ratingQuantity:{
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: Number,
  summary:{
    type: String,
    trim: true,
    required: [true, 'A tour must have summary']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover:{
    type: String,
    required: [true, 'A tour must have cover image']
  },
  images:[String],
  createdAt: {
    type: Date,
    default: Date.now()
  },
  startDates: [Date]
});



// making model
const Tour = mongoose.model('Tour', tourSchema);


module.exports = Tour;