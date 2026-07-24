const mongoose = require('mongoose');
const slugify = require('slugify');

//**********************************this contains the bussiness logic*****************************************************

// making schema
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    maxlength: [40, 'a tour name must have less or equal then 40 characters'],
    minlength: [10, 'a tour name must have more or equal than 10 characters']
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
    required: [true, 'a tour should have difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: ''
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'rating must above 1'],
    max: [5, 'rating must below 5']
  },
  ratingsQuantity:{
    type: Number,
    default: 0
  },
  secretTour: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,
    message: 'Discount price should be below the regular price',
    // adding custom validation
    validator : {
        validator: function(val){
            return val < this.price;
        },
        message: 'discount price should be below the regular price'
    }
  },
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
  },
  { toJSON: {virtuals: true},
    toObject: {virtuals: true}
  }
);


// virtual property can't be used in the query, as they are not
// the part of documents
tourSchema.virtual('durationWeeks').get(function(){
  return this.duration / 7;
});


/*
  middleware in moongose
  1)  document
  2)  query
  3)  aggregate
  4)  model
*/



// document middleware, runs before
// .save() and .create()
// this points to document
tourSchema.pre('save', function(){
  this.slug = slugify(this.name, {
    lower: true
  });
});


// secret tour in the db, it should not appear in the query
// will query on the tour which are not secret

tourSchema.pre('find', function(){
  this.find({secretTour: {$ne: true}});
});

tourSchema.pre('findOne', function(){
  this.find({secretTour: {$ne: true}});
  this.start = Date.now();
});

// aggregation middleware for the aggregation endpoint
// this point to aggregate obejct



// making model
const Tour = mongoose.model('Tour', tourSchema);


module.exports = Tour;
