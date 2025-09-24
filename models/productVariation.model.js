const mongoose = require('mongoose');

const productVariationSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, "Product ID is required"]
  },
  name: {
    type: String,
    required: [true, "Variation name is required"],
    trim: true,
    maxlength: [100, "Variation name cannot exceed 100 characters"]
  },
  price: {
    type: Number,
    required: [true, "Variation price is required"],
    min: [0, "Price must be greater than or equal to 0"]
  },
  stock: {
    type: Number,
    required: [true, "Stock is required"],
    default: 0,
    min: [0, "Stock must be greater than or equal to 0"]
  },
  image: {
    type: String,
    default: ""
  },
  // color: {
  //   type: String,
  //   trim: true
  // },
  // size: {
  //   type: String,
  //   trim: true
  // },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for better query performance
productVariationSchema.index({ product_id: 1 });
productVariationSchema.index({ status: 1 });
productVariationSchema.index({ isDeleted: 1 });
productVariationSchema.index({ createdBy: 1 });

// Virtual for soft delete
productVariationSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
productVariationSchema.set('toJSON', {
    virtuals: true
});


// Static method to find active variations
productVariationSchema.statics.findActive = function() {
    return this.find({ status: 'active', isDeleted: false });
};

// Static method to find by product ID
productVariationSchema.statics.findByProductId = function(productId) {
    return this.find({ 
        product_id: productId,
        isDeleted: false 
    });
};

const ProductVariation = mongoose.model('ProductVariation', productVariationSchema);
module.exports = ProductVariation;
