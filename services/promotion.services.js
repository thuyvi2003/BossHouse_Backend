//Vo Lam Thuy Vi
const Promotion = require('../models/promotion.model');
const Cart = require('../models/cart.model')
const UserPromotion = require('../models/userPromotion.model');





exports.createPromotion = async (promotionData) => {
    const promotion = await Promotion.create(promotionData);
    if (!promotion) {
        throw new Error('Failed to create promotion');
    } return promotion;
}




exports.getAllPromotionsAdmin = async (page, limit) => {
    const skip = (page - 1) * limit;
    const promotionsList = await Promotion.find()
        .skip(skip)
        .limit(limit);
    const total = await Promotion.countDocuments();
    return { promotionsList, total };
}

exports.getAllPromotionsUser = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const promotionsList = await Promotion.find({ is_hidden: { $ne: true } })
    skip(skip)
        .limit(limit);

    const total = await Promotion.countDocuments({ is_hidden: { $ne: true } })


    //If have user then get userCart
    let userCart = null;
    if (userId) {
        userCart = await Cart.findOne({ user_id: userId });
    }

    console.log("Day la userCart", userCart);

    const processedPromotions = promotionsList.map(promotion => {
        const promotionObj = promotion.toObject();
        promotionObj.is_valid = true;
        promotionObj.invalid_reason = null;

        if (promotion.max_uses && promotion.used_count >= promotion.max_uses) {
            promotionObj.is_valid = false;
            promotionObj.invalid_reason = 1;
        }

        if (promotion.expires_at && promotion.expires_at < Date.now()) {
            promotionObj.is_valid = false;
            promotionObj.invalid_reason = 2;
        }

        if (userCart && promotion.minimum_cart_value) {
            const cartTotal = userCart.total_price || 0;
            if (cartTotal < promotion.minimum_cart_value) {
                promotionObj.is_valid = false;
                promotionObj.invalid_reason = 3;
            }
        }

        return promotionObj;
    });

    return { promotionsList: processedPromotions, total };
};

exports.getPromotionById = async (promotionId) => {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) throw new Error("Promotion not found")
    return promotion;
}


exports.removePromotion = async (promotionId) => {
    const promotionDeleted = await Promotion.findByIdAndUpdate(promotionId, { is_hidden: true }, { new: true });
    if (!promotionDeleted) throw new Error("Delete promotion failed!!");
    return promotionDeleted;
}

exports.searchPromotion = async ({ code, status }) => {
    let filter = {};
    if (code) {
        filter.code = { $regex: code, $options: 'i' }
    }
    if (status !== undefined && status !== "") {
        filter.is_hidden = status === "true"; // "true" => true, "false" => false
    }

    return await Promotion.find(filter).sort({ createdAt: -1 });
}
exports.getAvailablePromotion = async (userId) => {
    //Get user cart
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found");

    const total = cart.original_price || 0;
    const promotions = await Promotion.find({
        is_hidden: false,
        $and: [
            //Loc dieu kien 
            { $or: [{ expires_at: null }, { expires_at: { $gt: new Date() } }] },
            { $or: [{ max_uses: null }, { $expr: { $lt: ["$used_count", "$max_uses"] } }] },
        ],
    });

    // Lọc tiếp theo điều kiện min cart (ví dụ > 100000)
    const available = promotions.filter((p) => {
        return !p.minimum_cart_value || total >= p.minimum_cart_value;
    });
    return { total, promotions: available };
}
exports.applyPromotion = async (userId, promotionId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error("Cart not found");


    const promo = await Promotion.findById(promotionId);
    if (!promo) throw new Error("Promotion not found");

    if (promo.is_hidden) throw new Error("Promotion is hidden");
    if (promo.expires_at && promo.expires_at < new Date())
        throw new Error("Promotion expired");
    if (promo.max_uses && promo.used_count >= promo.max_uses)
        throw new Error("Promotion usage limit reached");


    const total = cart.original_price || 0;
    if (promo.minimum_cart_value && total < promo.minimum_cart_value) {
        throw new Error(
            `Cart total must be at least ${promo.minimum_cart_value}đ to apply this promotion`
        );
    }
    cart.promotion_id = promo._id;
    await cart.save(); // pre('save') trong Cart tự tính total mới

    const updatedCart = await Cart.findById(cart._id)
        .populate("promotion_id")
        .populate({
            path: "items",
            populate: { path: "variation_id" },
        });
}


exports.claimPromotion = async (userId, promotionId) => {
    //Find promotion 
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) throw new Error("Promotion not found");
    //Find promotion if true then throw new Error
    if (promotion.is_hidden) throw new Error("Promotion is not available");

    // Kiểm tra hết hạn hoặc hết lượt dùng
    if (promotion.expires_at && promotion.expires_at < new Date()) {
        throw new Error("Promotion expired");
    }
    if (promotion.max_uses && promotion.used_count >= promotion.max_uses) {
        throw new Error("Promotion usage limit reached");
    }
    //Kiem tra xem trong userp promotion da co chua neu chua thi create con roi thi throw new Error
    const existed = await UserPromotion.findOne({
        user_id: userId,
        promotion_id: promotionId,
    });
    if (existed) throw new Error("You already claimed this promotion please select other promotion");
    const created = await UserPromotion.create({
        user_id: userId,
        promotion_id: promotionId,
        is_used: false,
    });
    const populated = await UserPromotion.findById(created._id)
        .populate({ path: "promotion_id" }) 
        .populate({ path: "user_id", select: "name email role" })
        .lean(); // trả về plain object (nhẹ hơn)

    return populated;

}
exports.getUserClaimedPromotions = async (userId) => {
    const userPromotions = await UserPromotion.find({
        user_id: userId
    }).populate("promotion_id").lean(); //Tra ve dang plain JS 


    if (!userPromotions.length) return [];

    return userPromotions.filter((up) => {
        const p = up.promotion_id;
        if (!p) return false;
        const expired = p.expires_at && p.expires_at < new Date();
        const overLimit = p.max_uses && p.used_count >= p.max_uses;

        return !p.is_hidden && !expired && !overLimit;
    })
        .map(({ promotion_id: p, is_used, createdAt }) => ({
            _id: p._id,
            code: p.code,
            description: p.description,
            type: p.promotion_type,
            value: p.promotion_value,
            expires_at: p.expires_at,
            used_count: p.used_count,
            max_uses: p.max_uses,
            is_used,
            claimed_at: createdAt,
        }));
}

