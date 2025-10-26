//Vo Lam Thuy Vi
const mongoose = require('mongoose');

const wishlistGroupSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 255,
        },
        is_default: {
            type: Boolean,
            default: false, // nhóm mặc định của user
        },
        is_shared: { type: Boolean, default: false },       // có được chia sẻ hay không
        share_token: { type: String, unique: true, sparse: true }, // token ngẫu nhiên để truy cập
        visibility: {
            type: String,
            enum: ['private', 'public'], // public: ai có link đều xem được
            default: 'private',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);
//Populate auto 
wishlistGroupSchema.virtual('items', {
    ref: 'wishlist',
    localField: '_id', // field bên WishlistGroup
    foreignField: 'group_id'   // field bên Wishlist
})

// Một user không được phép có 2 nhóm wishlist trùng tên
wishlistGroupSchema.index({ user_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('WishlistGroup', wishlistGroupSchema);
