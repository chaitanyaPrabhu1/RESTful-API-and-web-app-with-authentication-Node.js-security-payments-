const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');

const app = express();

// 1) MIDDLEWARES
// logs in the console
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));


app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);


app.all('*', (req, res, next)=>{
  // this will skip all the middleware, and go straight to the global error handler
  next(new AppError(`Can't find ${req.originalUrl} on the server`));
});



// error handling middleware

app.use(globalErrorHandler);


module.exports = app;
