const mongoose = require("mongoose");

const vetScheduleSchema = new mongoose.Schema(
  {
    veterinarian_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: true,
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    is_available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VetSchedule", vetScheduleSchema);
