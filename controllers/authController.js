const {promisify} = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}

// ValidationError → catchAsync → next(err) → globalErrorHandler

//==================================================================================================
//-------------------Signing------------------------------------------------------------------------
//==================================================================================================



exports.signup = catchAsync(async(req, res, next) => {

    // 2. Create user (assumes User model has pre-save password hashing middleware)
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    // 3. token = id + secret + expires_in
    const token = signToken(newUser._id);

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




exports.login = catchAsync(async(req, res, next)=>{
    const {email, password} = req.body;
    // check if the email and password exits
    // checj if th user exits && password correct
    // if ok, send token to client


    if(!email || !password){
        return next(new AppError('please provide email and password'));
    }

    const user = await User.findOne({email}).select('+password');

    // instance method
    if(!user || (!await user.correctPassword(password, user.password))){
        return next(new AppError('incorrect email or password', 404));
    }

    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });

});

/*
1) Split & decode – break the token into header.payload.signature, decode header to see the algorithm.
2) Pin the algorithm – only accept the algorithm your server expects, never trust the token's own header for this.
3) Verify signature – re-sign header+payload with your secret/public key and compare to the given signature. Mismatch = reject.
4) Check claims – validate exp, iss, aud (and nbf if present).
5) Trust it – if all pass, treat the payload as the authenticated user; otherwise return 401.
*/

exports.protect = catchAsync(async (req, res, next)=>{
    // getting token and check of its there
    // verification token
    // check if user still exits
    // check if user password after the token was issued
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new AppError('your are not logged in', 401));
    }

    // verficantion
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);


    // check if the user exits
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next( new AppError('the user of token does not exits', 401));
    }
    // check if the user changed the password after issue the token

    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again'), 401);
    }
    req.user = freshUser;
    //grand access to the next route handler
    next();
});

// when the restrict to will be called, then 

exports.restrictTo = (...roles) => {
    return (req, res, next)=>{
        // roles ['admin', 'lead-guide']
        // role ['user']
        if(!roles.includes(req.user.role)){
            return next(new AppError('you do not have permission to perform this action', 403));
        }
        next();
    }
}


exports.forgotPassword =  catchAsync(async(req, res, next)=>{
    // 1) get user based on the posted email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return next(new AppError('there is no user with that email', 404));
    }
    // 2) generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});
    // 3) send it to user email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `forgot your password? Submit a patch request with your new password and 
    and passwordConfirm to: ${resetURL}.\nif you didn't forgot your password, please ignore this email!`;


    try{
    await sendEmail({
        email: user.email,
        subject: 'your password reset token(valid for 10 minutes)',
        message
    });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({validateBeforeSave: false});


        return next(
            new AppError('there was an error sending the email. try again later!', 500)
        );
    }


    res.status(200).json({
        status: 'success',
        message: 'token send to email!'
    });

});




exports.resetPassword = (req, res, next)=>{}


