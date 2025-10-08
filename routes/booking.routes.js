const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const protectRoute = require("../middleware/auth.middleware");

// CREATE BOOKING
router.post(
  "/",
  protectRoute(["admin", "staff", "user"]),
  bookingController.createBooking
);

// VIEW BOOKING LIST
router.get(
  "/",
  protectRoute(["admin", "staff", "veterinarian", "user"]),
  bookingController.getAllBookings
);

// VIEW BOOKING DETAIL
router.get(
  "/:id",
  protectRoute(["admin", "staff", "veterinarian", "user"]),
  bookingController.getBookingById
);

// UPDATE BOOKING
router.put(
  "/:id",
  protectRoute(["admin", "staff", "user"]),
  bookingController.updateBooking
);

// CANCEL BOOKING
router.put(
  "/:id/cancel",
  protectRoute(["admin", "staff", "user"]),
  bookingController.cancelBooking
);

// SEARCH BOOKING
router.get(
  "/search",
  protectRoute(["admin", "staff", "user"]),
  bookingController.searchBooking
);

// FILTER BOOKING
router.get(
  "/filter",
  protectRoute(["admin", "staff", "user"]),
  bookingController.filterBooking
);

module.exports = router;
