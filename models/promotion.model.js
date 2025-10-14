//Vo Lam Thuy Vi
var mongoose = require("mongoose");
const promotionSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        promotion_type: {
            type: String,
            enum: ["percent", "fixed"],
            required: true,
        },
        promotion_value: {
            type: Number,
            required: true,
            min: 0,
        },
        max_uses: {
            type: Number,
            default: null,
        },
        used_count: {
            type: Number,
            default: 0,
        },
        is_hidden: {
            type: Boolean,
            default: false,
        },
        expires_at: {
            type: Date,
        },
        is_public: {
            type: Boolean
        }
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;
