const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'please provide a password'],
        minlength: 8,
        select: false
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
    },
    passwordChangedAt: Date
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

// jwt, encoded but not encrypted
// header + payload + signature
// signature = header + payload + server(saved in the server)


// instance method
// candidate password coming from user
// user password, which is hashed
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
}


userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');
}

const User = mongoose.model('User', userSchema);
module.exports = User;