const mongoose = require('mongoose');
const dotenv = require('dotenv');



// dotenv read the variable variable from .env file.
// .config load and parses the config file.
dotenv.config({ path: './config.env' });

const app = require('./app');

// connecting to the mongodb
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(()=>{
  // console.log(con.connection);
  console.log('DB Connected 😊😊😊😊😊');
});





// making a server online
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
