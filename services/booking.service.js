const mongoose = require("mongoose");
const Booking = require("../models/booking.model");
const Service = require("../models/service.model");

const toObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) return new mongoose.Types.ObjectId(id);
  throw new Error("Invalid ObjectId: " + id);
};

// --- Helper: populate booking ---
const populateBooking = (query) =>
  query
    .populate("user_id")
    .populate({
      path: "pet_id",
      populate: { path: "species" },
    })
    .populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    })
    .populate("services.service_id");

// --- Helper: calculate total price ---
const processServices = async (services) => {
  if (!services || !services.length) throw new Error("At least one service required");

  let total = 0;
  const processed = await Promise.all(
    services.map(async (s) => {
      const sid = toObjectId(s.service_id);
      const service = await Service.findById(sid);
      if (!service) throw new Error("Service not found: " + s.service_id);
      const quantity = s.quantity || 1;
      total += service.base_price * quantity;
      return {
        service_id: sid,
        quantity,
        base_price: service.base_price,
      };
    })
  );

  return { services: processed, total };
};

// --- Create booking ---
exports.createBooking = async (data) => {
  data.user_id = toObjectId(data.user_id);
  if (data.pet_id) data.pet_id = toObjectId(data.pet_id);
  if (data.veterinarian_id) data.veterinarian_id = toObjectId(data.veterinarian_id);

  // Validate pet info: phải có pet_id hoặc pet_name + pet_species
  if (!data.pet_id && (!data.pet_name || !data.pet_species)) {
    throw new Error("Either pet_id or both pet_name and pet_species are required");
  }

  const { services, total } = await processServices(data.services);
  data.services = services;
  data.total_price = total;

  const booking = await Booking.create(data);
  return populateBooking(Booking.findById(booking._id));
};

// --- Update booking ---
exports.updateBooking = async (id, data) => {
  if (data.user_id) data.user_id = toObjectId(data.user_id);
  if (data.pet_id) data.pet_id = toObjectId(data.pet_id);
  if (data.veterinarian_id) data.veterinarian_id = toObjectId(data.veterinarian_id);

  // Validate pet info
  if (!data.pet_id && (!data.pet_name || !data.pet_species)) {
    throw new Error("Either pet_id or both pet_name and pet_species are required");
  }

  if (data.services && data.services.length) {
    const { services, total } = await processServices(data.services);
    data.services = services;
    data.total_price = total;
  }

  return populateBooking(Booking.findByIdAndUpdate(id, data, { new: true }));
};

// --- Delete booking ---
exports.deleteBooking = async (id) => Booking.findByIdAndDelete(id);

// --- Cancel booking ---
exports.cancelBooking = async (id) =>
  populateBooking(Booking.findByIdAndUpdate(id, { status: "CANCELED" }, { new: true }));

// --- Search by note ---
exports.searchBooking = async (q) =>
  populateBooking(Booking.find({ note: { $regex: q, $options: "i" } }));

// --- Filter by status ---
exports.filterBooking = async (status) =>
  populateBooking(Booking.find({ status }));

// --- Get bookings by user ---
exports.getBookingsByUser = async (userId) =>
  populateBooking(Booking.find({ user_id: toObjectId(userId) }));

// --- Get all bookings ---
exports.getAllBookings = async () => populateBooking(Booking.find());

// --- Get booking by ID ---
exports.getBookingById = async (id) => populateBooking(Booking.findById(id));
