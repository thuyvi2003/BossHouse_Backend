const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    species: { type: String, required: true },
    breed: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    age: { type: Number },
    weight: { type: Number },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
