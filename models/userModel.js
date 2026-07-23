const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

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
        required: [true, 'please provide a password'],
        minlength: 8
    },
    passwordConfirm: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            // this only work on CREATE and SAVE!!!
            validator: function(el){
                return el === this.password;
            },
            message: 'password are not the same!'
        }
    }
});


// encrypt the password
userSchema.pre('save', async function(){
    if(!this.isModified('password')){
        return;
    }else{
        // hashing using bcrypt, first salt and encrypt
        // two equal password doesnot generate the same hash
        // 12 is cost, which represent the computation time
        // this is async version
        this.password = await bcrypt.hash(this.password, 12);
        // passwordConfirm is just needed to password validation during user creation
        this.passwordConfirm = undefined;
    }
});







const User = mongoose.model('User', userSchema);
module.exports = User;
