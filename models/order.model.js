//Vo Lam Thuy Vi
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    promotion_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion"
    }, // nếu có áp dụng mã
    items: [
        {
            product_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,
            price: Number
        }
    ],
    total_price: {
        type: Number,
        required: true
    },
    final_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "paid", "cancelled"],
        default: "pending"
    }
}, {
    timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
