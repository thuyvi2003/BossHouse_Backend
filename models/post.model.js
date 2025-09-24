const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        created_by: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE", "DRAFT"],
            default: "ACTIVE",
            required: true,
        },
        image: {
            type: String,
            required: true,
            trim: true,
        },
        // Thêm các trường bổ sung có thể hữu ích
        category: {
            type: String,
            trim: true,
            default: "general",
        },
        tags: [{
            type: String,
            trim: true,
        }],
        view_count: {
            type: Number,
            default: 0,
        },
        is_featured: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: Number,
            default: 0,
            min: 0,
            max: 10,
        },
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;