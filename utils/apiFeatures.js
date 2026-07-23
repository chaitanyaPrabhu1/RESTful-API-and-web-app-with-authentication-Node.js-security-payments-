// get the query object and req.query
/*
https://api.example.com/search?q=shoes&category=men&page=2&sort=price_asc
└──┬──┘ └──────┬───────┘└──┬──┘└──────────────────┬───────────────────────┘
 scheme       host        path                  query string
*/



class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {                              // ← renamed from sorting()
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // https://api.example.com/products?fields=name,price,ratingsAverage

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);   // ← now matches the variable
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /*
  API pagination is a way to split a large set of results into smaller "pages" instead of 
  sending everything back in one giant response.

  1)  page based
      https://api.example.com/products?page=2&limit=10

  2)  offset based
      https://api.example.com/products?offset=20&limit=10
  */

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;