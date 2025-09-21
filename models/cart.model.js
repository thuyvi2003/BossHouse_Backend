// Vo Lam Thuy Vi
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promotion_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
    default: null
  },
  original_price: { 
    type: Number,
    default: 0
  },
  promotion_amount: { 
    type: Number,
    default: 0
  },
  total_price: { 
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate items trong giỏ
cartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cart_id'
});

// Middleware tính lại giá trước khi lưu
cartSchema.pre('save', async function(next) {
  const CartItem = mongoose.model('CartItem');
  const Promotion = mongoose.model('Promotion');

  // Lấy danh sách items
  const cartItems = await CartItem.find({ cart_id: this._id }).populate('variation_id');

  let original = 0;
  if (cartItems && cartItems.length > 0) {
    for (const item of cartItems) {
      if (item.variation_id && item.variation_id.price) {
        original += item.variation_id.price * item.quantity;
      }
    }
  }

  this.original_price = original;
  this.promotion_amount = 0;
  this.total_price = original;

  // Nếu có promotion
  if (this.promotion_id) {
    const promo = await Promotion.findById(this.promotion_id);

    if (promo && (!promo.expires_at || promo.expires_at > new Date())) {
      let promotionValue = 0;

      if (promo.promotion_type === 'percent') {
        promotionValue = (original * promo.promotion_value) / 100;
        if (promo.max_discount_value) {
          promotionValue = Math.min(promotionValue, promo.max_discount_value);
        }
      } else if (promo.promotion_type === 'fixed') {
        promotionValue = promo.promotion_value;
      }

      this.promotion_amount = Math.min(original, promotionValue);
      this.total_price = original - this.promotion_amount;
    }
  }

  next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
