//Vo Lam Thuy Vi
const mongoose = require('mongoose');

// Cart Item Schema
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
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discount_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount'
  },
  original_price: {
    type: Number,
    default: 0
  },
  discount_amount: {
    type: Number,
    default: 0
  },
  total_price: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for cart items
cartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cart_id'
});

// Pre-save middleware to calculate total price
cartSchema.pre('save', async function(next) {
  if (this.isModified('discount_id')) {
    // Lấy danh sách cart items
    const CartItem = mongoose.model('CartItem');
    const cartItems = await CartItem.find({ cart_id: this._id }).populate('variation_id');
    
    let total = 0;
    
    if (cartItems && cartItems.length > 0) {
      for (const item of cartItems) {
        if (item.variation_id && item.variation_id.price) {
          total += item.variation_id.price * item.quantity;
        }
      }
    }
    
    // Apply discount if exists
    if (this.discount_id) {
      await this.populate('discount_id');
      const discount = this.discount_id;
      
      if (discount && discount.isValid()) {
        if (discount.discount_type === 'percentage') {
          total = total * (1 - discount.discount_value / 100);
        } else if (discount.discount_type === 'fixed') {
          total = Math.max(0, total - discount.discount_value);
        }
      }
    }
    
    this.total_price = total;
  }
  
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);

module.exports = { Cart, CartItem }; 