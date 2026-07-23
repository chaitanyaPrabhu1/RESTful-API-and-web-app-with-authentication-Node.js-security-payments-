module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  }
};




/*
function wrapWithLogging(fn) {
  return function(a, b) {
    console.log("Before calling, with:", a, b);
    const result = fn(a, b);
    console.log("After calling, result is:", result);
    return result;
  };
}

function add(a, b) {
  return a + b;
}

const loggedAdd = wrapWithLogging(add);

console.log(loggedAdd(2, 3));
*/