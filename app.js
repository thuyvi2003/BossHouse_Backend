require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");

// Routers
const promotionRouter = require("./routes/promotion.routes");
const authRouter = require("./routes/auth.routes");
const profileRouter = require("./routes/profile.routes");
const accountManagementRouter = require("./routes/accountManagement.routes");
const cartRouter = require("./routes/cart.routes");
const bookingRouter = require("./routes/booking.routes");
const categoryRouter = require("./routes/category.routes");
const productRouter = require("./routes/product.routes");
const productVariationRouter = require("./routes/productVariation.routes");
const userRouter = require("./routes/user.routes");
const petRouter = require("./routes/pet.routes");
const serviceRouter = require("./routes/service.routes");
const vetRouter = require("./routes/veterinarian.routes");
const postRouter = require("./routes/post.routes");
const wishlistRouter = require("./routes/wishlist.routes");
const contactRouter = require("./routes/contact.routes");
const scheduleRouter = require("./routes/vetSchdule.routes");
const reviewRouter = require("./routes/review.routes");
const notificationRouter = require("./routes/notification.routes");
const orderRouter = require("./routes/order.routes");
const stockRouter = require("./routes/stock.routes");
const ghnShippingRouter = require("./routes/shipping.routes");
const app = express();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/bosshouse";
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🌟🔮 MongoDB Ready to Serve 🍀⚡");
  })
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB", err);
  });

// Models
require("./models/user.model");
require("./models/pet.model");
require("./models/service.model");
require("./models/veterinarian.model");
require("./models/vetSchedule.model");
require("./models/booking.model");
require("./models/category.model");
require("./models/product.model");
require("./models/productVariation.model");
require("./models/contact.model")
require("./models/post.model");
require("./models/promotion.model");
require("./models/cart.model");
require("./models/vetSchedule.model");
require("./models/review.model");
require("./models/reviewReply.model");
require("./models/stock.model");


// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// Middlewares
app.use(logger("dev"));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin/account-management", accountManagementRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/carts", cartRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/variations", productVariationRouter);
app.use("/api/users", userRouter);
app.use("/api/pets", petRouter);
app.use("/api/services", serviceRouter);
app.use("/api/veterinarians", vetRouter);
app.use("/api/posts", postRouter);
app.use("/api/wishlists", wishlistRouter);
app.use("/api/contacts", contactRouter);
app.use("/uploads", express.static('uploads'));
app.use("/api/schedules", scheduleRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/stocks", stockRouter);
app.use("/api/orders", orderRouter);
app.use("/api/shipping", ghnShippingRouter);


// Catch 404
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
