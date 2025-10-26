const mongoose = require("mongoose");

const reviewReplySchema = new mongoose.Schema(
  {
    review_id: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, required: true }, // HTML allowed
    status: { type: String, enum: ["visible", "deleted"], default: "visible" },
    created_by_role: { type: String, enum: ["admin", "staff", "veterinarian", "user"], required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

reviewReplySchema.index({ review_id: 1, created_at: 1 });

module.exports = mongoose.model("ReviewReply", reviewReplySchema);


