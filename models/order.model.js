// Vo Lam Thuy Vi
const mongoose = require("mongoose");
const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariation",
    },
    product_name: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    promotion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Promotion",
      default: null,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
//  Tong hang
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping_fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    final_price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",     // chờ thanh toán
        "paid",        // đã thanh toán
        "processing",  // đang xử lý
        "shipping",    // đang giao
        "completed",   // hoàn tất
        "cancelled",   // đã hủy
      ],
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: ["cash", "vnpay"],
      default: "cash",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },

    shipping_address: {
      name: String,
      email: String,
      phone: String,
      country: String,
      city: String,
      address: String,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 255,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

orderSchema.index({ user_id: 1, status: 1 });
orderSchema.index({ created_at: -1 });

orderSchema.pre("validate", function (next) {
  if (this.items && this.items.length > 0) {
    this.items = this.items.map((i) => ({
      ...i,
      subtotal: i.price * i.quantity,
    }));

    // tổng tiền hàng
    this.subtotal = this.items.reduce((sum, i) => sum + i.subtotal, 0);

    // tổng cuối cùng
    this.final_price =
      this.subtotal - (this.discount_amount || 0) + (this.shipping_fee || 0);
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
