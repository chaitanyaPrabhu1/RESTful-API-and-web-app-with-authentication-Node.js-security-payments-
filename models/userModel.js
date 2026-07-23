const mongoose = require('mongoose');
const validator = require('validator');

// name, email, photo, password, passwordConfirm

// will add validators, to check if they are in correct format or not?

userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please tell us your name']
    },
    email:{
        type: String,
        required: [true, 'please provide the email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid emial']
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'please a password'],
        minlength: 8
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            // this only work on CREATE and SAVE!!!
            validator: function(el){
                return el === this.password;
            }
        }
    }
});


const User = mongoose.model('User', userSchema);


module.exports = User;