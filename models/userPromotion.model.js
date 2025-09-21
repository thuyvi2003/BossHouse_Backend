//Vo Lam Thuy Vi
const mongoose = require("mongoose");

const userPromotionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  promotion_id: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion", required: true },
  is_used: { type: Boolean, default: false },
  used_at: { type: Date }
}, {
  timestamps: true
});

//1 user chỉ claim 1 mã duy nhất 1 lần
userPromotionSchema.index({ user_id: 1, promotion_id: 1 }, { unique: true });

const UserPromotion = mongoose.model("UserPromotion", userPromotionSchema);
module.exports = UserPromotion;
