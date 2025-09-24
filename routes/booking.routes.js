const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");

router.post("/", bookingController.createBooking);
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingById);
router.put("/:id", bookingController.updateBooking);
router.delete("/:id", bookingController.deleteBooking);
router.put("/:id/cancel", bookingController.cancelBooking);

router.get("/search", bookingController.searchBooking); // /api/bookings/search/q?q=abc
router.get("/filter", bookingController.filterBooking); // /api/bookings/filter/status?status=CONFIRMED

module.exports = router;
