//Vo Lam Thuy Vi
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_variation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariation",
      required: true,
    },
      group_id: {                           
      type: mongoose.Schema.Types.ObjectId,
      ref: "WishlistGroup",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255,
    },
      status: {
      type: String,
      enum: ["active", "moved_to_cart", "removed"],
      default: "active",
    },
    is_purchased: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Không cho trùng sản phẩm trong wishlist của cùng user
wishlistSchema.index({ user_id: 1, product_variation_id: 1 }, { unique: true });

module.exports = mongoose.model("wishlist", wishlistSchema);
