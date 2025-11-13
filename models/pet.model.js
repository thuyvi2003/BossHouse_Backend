const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    species: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetType",
      required: true,
    },
    breed: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    age: { type: Number },
    weight: { type: Number, default: 0.0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
