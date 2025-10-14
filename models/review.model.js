const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    target_type: { type: String, enum: ["product", "service"], required: true },
    target_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, default: "" }, // HTML allowed from RTE
    images: [{ type: String, trim: true }],
    status: { type: String, enum: ["visible", "hidden", "deleted"], default: "visible" },
    created_by_role: { type: String, enum: ["admin", "staff", "veterinarian", "user"], required: true },
    likes: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    order_successful: {
      type: Boolean,
      default: true // ✅ để test khi chưa có order / payment
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

reviewSchema.index({ target_type: 1, target_id: 1, created_at: -1 });
reviewSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model("Review", reviewSchema);


