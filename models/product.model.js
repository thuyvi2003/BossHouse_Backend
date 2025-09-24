const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [2, "Product name must be at least 2 characters long"],
            maxlength: [100, "Product name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
            default: ""
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price must be greater than or equal to 0"]
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, "Stock must be greater than or equal to 0"]
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"]
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        image: {
            type: String,
            default: ""
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    }
);

// Indexes for better query performance
productSchema.index({ name: 1, categoryId: 1 }); // Compound index for duplicate name check within category
productSchema.index({ categoryId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ created_at: -1 });

// Virtual for soft delete
productSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', {
    virtuals: true
});

// Pre-save middleware to check for duplicate names within the same category
productSchema.pre('save', async function(next) {
    if (this.isModified('name') || this.isModified('categoryId')) {
        const existingProduct = await this.constructor.findOne({
            name: this.name,
            categoryId: this.categoryId,
            isDeleted: false,
            _id: { $ne: this._id }
        });
        
        if (existingProduct) {
            const error = new Error('Product name already exists in this category');
            error.statusCode = 400;
            return next(error);
        }
    }
    next();
});


// Static method to find active products
productSchema.statics.findActive = function() {
    return this.find({ status: 'active', isDeleted: false });
};

// Static method to find by name and category (case insensitive)
productSchema.statics.findByNameAndCategory = function(name, categoryId) {
    return this.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        categoryId: categoryId,
        isDeleted: false 
    });
};

// Static method to calculate total stock from variations
productSchema.methods.calculateTotalStock = async function() {
    const ProductVariation = mongoose.model('ProductVariation');
    const variations = await ProductVariation.find({ 
        product_id: this._id,
        isDeleted: false 
    });
    
    return variations.reduce((total, variation) => total + (variation.stock || 0), 0);
};

// Instance method to update stock from variations
productSchema.methods.updateStockFromVariations = async function() {
    const totalStock = await this.calculateTotalStock();
    this.stock = totalStock;
    return this.save();
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
