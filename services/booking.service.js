const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");

const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  throw new Error("Invalid ObjectId: " + id);
};

// Create booking
exports.createBooking = async (data) => {
  data.user_id = toObjectId(data.user_id);
  data.pet_id = toObjectId(data.pet_id);
  if (data.veterinarian_id) data.veterinarian_id = toObjectId(data.veterinarian_id);

  if (!data.services || !data.services.length)
    throw new Error("At least one service required");

  // Chuyển service_id sang ObjectId và tính tổng giá
  let total = 0;
  data.services = await Promise.all(
    data.services.map(async (s) => {
      const sid = toObjectId(s.service_id);
      const service = await Service.findById(sid);
      if (!service) throw new Error("Service not found: " + s.service_id);
      total += service.base_price * (s.quantity || 1);
      return { service_id: sid, quantity: s.quantity || 1, base_price: service.base_price };
    })
  );
  data.total_price = total;

  return await Booking.create(data);
};

// Get all bookings
exports.getAllBookings = async () =>
  Booking.find()
    .populate("user_id pet_id veterinarian_id")
    .populate("services.service_id");

// Get booking by ID
exports.getBookingById = async (id) =>
  Booking.findById(id)
    .populate("user_id pet_id veterinarian_id")
    .populate("services.service_id");

// Update booking
exports.updateBooking = async (id, data) => {
  if (data.services && data.services.length) {
    let total = 0;
    data.services = await Promise.all(
      data.services.map(async (s) => {
        const sid = toObjectId(s.service_id);
        const service = await Service.findById(sid);
        if (!service) throw new Error("Service not found: " + s.service_id);
        total += service.base_price * (s.quantity || 1);
        return { service_id: sid, quantity: s.quantity || 1, base_price: service.base_price };
      })
    );
    data.total_price = total;
  }

  return Booking.findByIdAndUpdate(id, data, { new: true })
    .populate("user_id pet_id veterinarian_id")
    .populate("services.service_id");
};

// Delete booking
exports.deleteBooking = async (id) => Booking.findByIdAndDelete(id);

// Cancel booking
exports.cancelBooking = async (id) =>
  Booking.findByIdAndUpdate(id, { status: "CANCELED" }, { new: true });

// Search by note
exports.searchBooking = async (q) =>
  Booking.find({ note: { $regex: q, $options: "i" } })
    .populate("user_id pet_id veterinarian_id")
    .populate("services.service_id");

// Filter by status
exports.filterBooking = async (status) =>
  Booking.find({ status })
    .populate("user_id pet_id veterinarian_id")
    .populate("services.service_id");
