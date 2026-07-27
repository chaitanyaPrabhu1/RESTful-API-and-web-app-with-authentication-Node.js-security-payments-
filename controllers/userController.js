const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../utils/handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user tries to update password here
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not for password updates. please use /updatePassword',
        400
      )
    );
  }

  // 2) filter out unwanted field names that aren't allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  // 3) update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: { user: updatedUser }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res, next) => {
  next(
    new AppError(
      'this route is not defined! please use /signup instead',
      400
    )
  );
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do NOT update passwords with this - admin route, no password updates
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
