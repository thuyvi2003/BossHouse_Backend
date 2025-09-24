const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");

const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  throw new Error("Invalid ObjectId: " + id);
};

exports.createBooking = async (data) => {
  data.user_id = toObjectId(data.user_id);
  data.pet_id = toObjectId(data.pet_id);
  data.service_id = toObjectId(data.service_id);
  if (data.veterinarian_id) data.veterinarian_id = toObjectId(data.veterinarian_id);

  // Tính giá từ service
  const service = await Service.findById(data.service_id);
  if (!service) throw new Error("Service not found");
  data.total_price = service.base_price;

  return await Booking.create(data);
};

exports.getAllBookings = async () =>
  Booking.find().populate("user_id pet_id service_id veterinarian_id");

exports.getBookingById = async (id) =>
  Booking.findById(id).populate("user_id pet_id service_id veterinarian_id");

exports.updateBooking = async (id, data) =>
  Booking.findByIdAndUpdate(id, data, { new: true }).populate(
    "user_id pet_id service_id veterinarian_id"
  );

exports.deleteBooking = async (id) => Booking.findByIdAndDelete(id);

exports.cancelBooking = async (id) =>
  Booking.findByIdAndUpdate(id, { status: "CANCELED" }, { new: true });

exports.searchBooking = async (q) =>
  Booking.find({ note: { $regex: q, $options: "i" } }).populate(
    "user_id pet_id service_id veterinarian_id"
  );

exports.filterBooking = async (status) =>
  Booking.find({ status }).populate("user_id pet_id service_id veterinarian_id");
