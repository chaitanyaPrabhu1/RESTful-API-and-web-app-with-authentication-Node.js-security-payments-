const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const aiRouter = require('./routes/aiRoutes');
const AppError = require('./utils/appError');

const app = express();

// 1) GLOBAL MIDDLEWARES

// set security HTTP headers
app.use(helmet());

// allow cross-origin requests (the static frontend + any external client)
app.use(cors());

// logs in the console
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit requests from the same IP
const globalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'too many requests from this IP, please try again in an hour!'
});
app.use('/api', globalLimiter);

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// prevent http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/ai', aiRouter);

app.all('*', (req, res, next) => {
  // this will skip all the middleware, and go straight to the global error handler
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});



// error handling middleware

app.use(globalErrorHandler);


module.exports = app;
