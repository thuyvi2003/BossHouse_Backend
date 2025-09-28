//Vo Lam Thuy Vi
const Promotion = require('../models/promotion.model');
const Cart = require('../models/cart.model')





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




module.exports.getAllPromotionsUser = async (userId, page, limit) => {
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

