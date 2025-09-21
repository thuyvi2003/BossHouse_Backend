// Vo Lam Thuy Vi
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  variation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductVariation',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  added_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);
module.exports = CartItem;
