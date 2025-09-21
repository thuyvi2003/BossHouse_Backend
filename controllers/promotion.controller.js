//Vo Lam Thuy Vi
const promotionService = require('../services/promotion.services');

exports.createPromotion = async (req, res, next) => {
    try {
        const promotionData = req.body;
        const promotion = await promotionService.createPromotion(promotionData);
        res.status(201).json({
            status: 'success',
            data: promotion
        });
    } catch (error) {
        next(error);
    }
};
exports.getAllPromotionsAdmin = async (req, res, next) => {
    try {
        const promotionsList = await promotionService.getAllPromotionsAdmin();
        res.status(200).json({
            status: 'success',
            data: promotionsList
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllPromotionsUser = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : null;
        console.log("Day la userID", userId);
        const promotionsList = await promotionService.getAllPromotionsUser(userId);
        res.status(200).json({
            status: 'success',
            data: promotionsList
        });
    } catch (error) {
        next(error);
    }
}
