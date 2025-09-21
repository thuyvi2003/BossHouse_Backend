// Vo Lam Thuy Vi
const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  color: {
    type: String
  },
  size: {
    type: String
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);
module.exports = ProductVariation;
