const mongoose = require("mongoose");

const veterinarianSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialty: { type: String },
    years_experience: { type: Number },
    bio: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Veterinarian", veterinarianSchema);
