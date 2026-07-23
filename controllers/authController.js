const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');




exports.signup = catchAsync(async(req, res, next) => {

    // 2. Create user (assumes User model has pre-save password hashing middleware)
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    // 3. Fix JWT signing syntax
    const token = jwt.sign(
        { id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 4. Don't send password fields back to client
    newUser.password = undefined;
    newUser.passwordConfirm = undefined;

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});




exports.login = (req, res, next)=>{
    const {email, password} = req.body.email;
    // check if the email and password exits
    // checj if th user exits && password correct
    // if ok, send token to client


    if(!email || !password){
        next(new AppError('please provide email and passworld'));
    }


    
};
