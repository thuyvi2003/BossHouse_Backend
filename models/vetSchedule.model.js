const mongoose = require("mongoose");

const vetScheduleSchema = new mongoose.Schema(
  {
    veterinarian_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Veterinarian",
      required: [true, "Veterinarian ID is required"],
    },
    start_time: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: Date,
      required: [true, "End time is required"],
      validate: {
        validator: function () {
          return this.end_time > this.start_time;
        },
        message: "End time must be greater than start time",
      },
    },
    is_available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VetSchedule", vetScheduleSchema);
