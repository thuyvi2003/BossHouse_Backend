const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pet" }, // optional now
    pet_name: { type: String }, // fallback khi không có pet_id
    pet_species: { type: String }, // fallback khi không có pet_id
    services: [
      {
        service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
        quantity: { type: Number, default: 1 },
        base_price: { type: Number, default: 0 },
      },
    ],
    veterinarian_id: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinarian" },
    booking_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELED", "COMPLETED"],
      default: "PENDING",
    },
    total_price: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
