// this is just an script, not an express server
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

// dotenv read the variable variable from .env file.
// .config load and parses the config file.
dotenv.config({ path: `${__dirname}/../../config.env` });

// connecting to the mongodb
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB).then(() => {
  console.log('DB Connected 😊😊😊😊😊');
});

// reading the files
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// import data into db
const importDB = async () => {
  try {
    // Tour.create()/Review.create() run pre('save') hooks (slug, embedding,
    // rating recalculation) - intentional. Users use insertMany() instead,
    // since it never runs 'save' middleware (so the already-bcrypt-hashed
    // seed passwords don't get re-hashed) while still casting fields like
    // _id to their proper schema types (unlike { lean: true }, which would
    // insert the seed data's string _id as-is and break later findById
    // lookups). passwordConfirm just needs to equal password to satisfy the
    // schema validator - it doesn't need to be the real plaintext.
    await Tour.create(tours);
    await User.insertMany(
      users.map(user => ({ ...user, passwordConfirm: user.password }))
    );
    // passwordConfirm is a write-only field the pre('save') hook normally
    // clears before persisting - insertMany() skips that hook, so unset it
    // here instead of leaving a bcrypt hash sitting in the database
    await User.updateMany({}, { $unset: { passwordConfirm: 1 } });
    await Review.create(reviews);
    console.log('data loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// delete all the data from the collections
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('collections deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importDB();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
