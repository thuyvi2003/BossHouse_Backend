const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true, // Prevents duplicates
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: false, // No need for created/updated
    }
);

// TTL index: Auto-delete documents when expiresAt passes (expireAfterSeconds: 0)
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model("TokenBlacklist", tokenBlacklistSchema);

module.exports = TokenBlacklist;