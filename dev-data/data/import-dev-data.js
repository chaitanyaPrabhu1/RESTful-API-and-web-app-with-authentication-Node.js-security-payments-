// this is just an script, not an express server
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('./../../models/tourmodel');


// dotenv read the variable variable from .env file.
// .config load and parses the config file.
dotenv.config({ path: './config.env' });



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





// reading the file

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

// import data into db
const importDB = async()=>{
    try{
        await Tour.create(tours);
        console.log('data loaded');
    }catch(err){
        console.log(err);
    }
    process.exit();
};


// delete all the data from the collection
const deleteData = async()=>{
    try{
        await Tour.deleteMany();
        console.log('collection deleted');
    }catch(err){
        console.log(err);
    }
    process.exit();
};


if(process.argv[2] === '--import'){
    importDB();
}else if(process.argv[2] == '--delete'){
    deleteData();
}



