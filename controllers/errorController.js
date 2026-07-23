// final error handler
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
}



const sendErrorProd = (err, res) => {
  // operational, trusted error: send message to client
  if(err.isOperational){
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }else{
    // programming and other, don't want to leak detail to the client
    console.log('error! Kaboom!!!');
    res.status(500).json({
      status: 'error',
      message: 'something went very wrong'
    });
  }

}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';


  if(process.env.NODE_ENV === 'development'){
    sendErrorDev(err, res);
  }else if(process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }

};