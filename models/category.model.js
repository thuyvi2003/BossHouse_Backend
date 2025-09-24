const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
            minlength: [2, "Category name must be at least 2 characters long"],
            maxlength: [50, "Category name cannot exceed 50 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, "Description cannot exceed 200 characters"],
            default: ""
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

// Index for better query performance
// categorySchema.index({ name: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ isDeleted: 1 });
categorySchema.index({ createdBy: 1 });

// Virtual for soft delete
categorySchema.virtual('id').get(function() {
    return this._id.toHexString();
});

// Ensure virtual fields are serialized
categorySchema.set('toJSON', {
    virtuals: true
});

// Pre-save middleware to check for duplicate names (excluding soft deleted)
categorySchema.pre('save', async function(next) {
    if (this.isModified('name')) {
        const existingCategory = await this.constructor.findOne({
            name: this.name,
            isDeleted: false,
            _id: { $ne: this._id }
        });
        
        if (existingCategory) {
            const error = new Error('Category name already exists');
            error.statusCode = 400;
            return next(error);
        }
    }
    next();
});

// Static method to find active categories
categorySchema.statics.findActive = function() {
    return this.find({ status: 'active', isDeleted: false });
};

// Static method to find by name (case insensitive)
categorySchema.statics.findByName = function(name) {
    return this.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isDeleted: false 
    });
};

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
