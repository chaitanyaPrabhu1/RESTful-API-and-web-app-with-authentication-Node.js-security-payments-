const mongoose = require('mongoose');
const dotenv = require('dotenv');

// dotenv reads the variables from the .env file.
// .config loads and parses the config file.
dotenv.config({ path: './config.env' });

const app = require('./app');

// connecting to the mongodb
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log('DB Connected 😊😊😊😊😊');
});

// making a server online
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});