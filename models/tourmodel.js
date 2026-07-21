const mongoose = require('mongoose');
const slugify = require('slugify');

//**********************************this contains the bussiness logic*****************************************************

// making schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true
  },
  slug: String,
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
  ratingsQuantity:{
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
}, {toJSON: {virtuals: true}, toObject: {virtuals: true}});


// virtual property can't be used in the query, as they are not
// the part of documents
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
});


// document middleware, runs before
// .save() and .create()
tourSchema.pre('save', function(next){
  this.slug = slugify(this.name, {
    lower: true
  });

  next();
});


// post
tourSchema.post('save', function(doc, next){
  // does not have this, but finished document

  // don't need to have next, as its last
  next();
});

// making model
const Tour = mongoose.model('Tour', tourSchema);


module.exports = Tour;