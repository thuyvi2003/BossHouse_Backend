//Vo Lam Thuy Vi
const promotionService = require('../services/promotion.services');

exports.createPromotion = async (req, res, next) => {
    try {
        const promotionData = req.body;
        const promotion = await promotionService.createPromotion(promotionData);
        res.status(201).json({
            status: 'success',
            data: discount
        });
    } catch (error) {
        next(error);
    }
};
exports.getAllPromotionsUser = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : null;
        console.log("Day la userID", userId);
        const discounts = await discountService.getAllDiscounts(userId);
        res.status(200).json({
            status: 'success',
            data: discounts
        });
    } catch (error) {
        next(error);
    }
}
exports.getAllPromotionsAdmin = async (req, res, next) => {
    try {
        const discounts = await discountService.getAllDiscountsAdmin();
        res.status(200).json({
            status: 'success',
            data: discounts
        });
    } catch (error) {
        next(error);
    }
};
