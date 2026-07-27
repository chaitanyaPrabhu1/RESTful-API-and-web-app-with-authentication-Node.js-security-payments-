const mongoose = require('mongoose');
const slugify = require('slugify');
const { embedText } = require('./../utils/embeddings');

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
      message: 'difficulty is either: easy, medium, difficult'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'rating must above 1'],
    max: [5, 'rating must below 5'],
    set: val => Math.round(val * 10) / 10
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
    validate: {
      // this only works on document creation, not on update
      validator: function(val){
        return val < this.price;
      },
      message: 'discount price ({VALUE}) should be below the regular price'
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
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  // embedding vector used for semantic search / RAG retrieval, kept out of
  // normal API responses and recomputed whenever the descriptive text changes
  embedding: {
    type: [Number],
    select: false
  },
  startLocation: {
    // GeoJSON
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
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

// virtual populate: reviews for this tour, without embedding the reviews
// array in every tour document
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
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

// keep the semantic-search embedding in sync with the descriptive text -
// only recompute it when that text actually changed, since generating it
// is the slowest part of saving a tour
tourSchema.pre('save', async function() {
  if (
    !this.isModified('name') &&
    !this.isModified('summary') &&
    !this.isModified('description') &&
    !this.isModified('difficulty')
  ) {
    return;
  }

  const text = [this.name, this.summary, this.description, this.difficulty]
    .filter(Boolean)
    .join('. ');

  try {
    this.embedding = await embedText(text);
  } catch (err) {
    // don't block tour creation/updates if the local embedding model
    // fails to load (e.g. first run without network access) - the tour
    // just won't be included in semantic search results until it's saved
    // again successfully
    console.error('failed to generate tour embedding:', err.message);
  }
});


// secret tour in the db, it should not appear in the query
// will query on the tour which are not secret

tourSchema.pre(/^find/, function(){
  this.find({secretTour: {$ne: true}});
  this.start = Date.now();
});

tourSchema.pre(/^find/, function() {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
});

// aggregation middleware for the aggregation endpoint
// this point to aggregate obejct



// making model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
