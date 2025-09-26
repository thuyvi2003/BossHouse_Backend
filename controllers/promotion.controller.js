//Vo Lam Thuy Vi
const promotionService = require('../services/promotion.services');

exports.createPromotion = async (req, res, next) => {
    try {
        const promotionData = req.body;
        const promotion = await promotionService.createPromotion(promotionData);
        res.status(201).json({
            status: 'success',
            message: 'Create promotion is successfully',
            data: promotion
        });
    } catch (error) {
        next(error);
    }
};



exports.getAllPromotionsAdmin = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const { promotionsList, total } = await promotionService.getAllPromotionsAdmin(page, limit);
        res.status(200).json({
            status: 'success',
            message: 'Get all promotions list is successfully',
            data: promotionsList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllPromotionsUser = async (req, res, next) => {
    try {
        const userId = req.user ? req.user._id : null;
        console.log("Day la userID", userId);
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const promotionsList = await promotionService.getAllPromotionsUser(userId, page, limit);
        res.status(200).json({
            status: 'success',
            message: 'Get all promotions list is successfully',
            data: promotionsList,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
}
