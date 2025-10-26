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
        min_order_value: {
            type: Number,
            default: 0, // đơn hàng tối thiểu để áp dụng
        },
        max_promotion_value: {
            type: Number,
            default: null, // giá trị giảm tối đa cho percent
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


// Index: unique code + nhanh cho query public/hidden
promotionSchema.index({ code: 1 }, { unique: true });
promotionSchema.index({ is_public: 1, is_hidden: 1, expires_at: 1 });



//Help kiem tra promotion con hieu luc ko
promotionSchema.methods.isValid = function (totalPrice) {
    const now = new Date();

    if (this.is_hidden) return false; // mã bị ẩn thì không áp dụng
    if (this.expires_at && now > this.expires_at) return false; // hết hạn
    if (this.max_uses && this.used_count >= this.max_uses) return false; // hết lượt dùng
    if (totalPrice < this.min_order_value) return false; // chưa đủ giá trị đơn hàng tối thiểu
    return true;
};

//Calculate the discount amount
promotionSchema.methods.calculateDiscount = function (totalPrice) {
    if (!this.isValid(totalPrice)) return 0;
    let discount = 0;

    if (this.promotion_type === "percent") {
        discount = totalPrice * (this.promotion_value / 100);
        if (this.max_discount_value && discount > this.max_discount_value) {
            discount = this.max_discount_value;
        }
    } else if (this.promotion_type === "fixed") {
        discount = this.promotion_value;
    }
}

const Promotion = mongoose.model("Promotion", promotionSchema);
module.exports = Promotion;
