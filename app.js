/** ⛔⛔⛔    CẢNH BÁO: ĐỌC FILE README TRƯỚC KHI CODE  ⛔⛔⛔  */

require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var cors = require('cors');

//Import router in here 
const promotionRouter = require('./routes/promotion.routes');
const authRouter = require('./routes/auth.routes');
const cartRouter = require('./routes/cart.routes');
const postRouter = require('./routes/post.routes');


var app = express();
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('"🌟🔮 MongoDB Ready to Serve 🍀⚡"');
}).catch(err => {
  console.error('Error connecting to MongoDB', err);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Enable CORS for all routes
app.use(cors());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/promotions', promotionRouter);
app.use('/api/carts', cartRouter);
app.use('/api/posts', postRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
