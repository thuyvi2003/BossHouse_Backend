/** ⛔⛔⛔    CẢNH BÁO: ĐỌC FILE README TRƯỚC KHI CODE  ⛔⛔⛔  */

require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

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

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// serve uploads as static
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ✅ Enable CORS for all routes
app.use(cors());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/promotions', promotionRouter);
app.use('/api/carts', cartRouter);
app.use('/api/posts', postRouter);

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
