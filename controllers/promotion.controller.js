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

exports.getPromotionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const promotion = await promotionService.getPromotionById(id);
        res.status(200).json({
            status: 'success',
            message: 'Get promotion is successfully',
            success: true,
            data: promotion
        });
    } catch (error) {
        next(error);
    }
}
exports.removePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const promotionDeleted = await promotionService.removePromotion(id);
        res.status(200).json({
            status: 'success',
            message: 'Remove promotion is successfully',
            success: true,
            data: promotionDeleted
        });
    } catch (error) {
        next(error);
    }
}

exports.updatePromotion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedPromotion = await promotionService.editPromotion(id, updateData);

        return res.status(200).json({
            success: true,
            message: "Promotion updated successfully",
            data: updatedPromotion,
        });
    } catch (error) {
        console.error("Error updating promotion:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update promotion",
        });
    }
};

exports.searchPromotion = async (req, res, next) => {
    try {
        const { code, status } = req.query;
        const promotions = await promotionService.searchPromotion({ code, status })
        res.status(200).json(
            {
                status: 'success',
                message: 'Success',
                success: true,
                data: promotions
            }
        );
    } catch (error) {
        next(error);
    }
}
exports.getAvailablePromotion = async (req, res, next) => {
    try {
        const userId = req.user?._id || req.body.user_id;
        const result = await promotionService.getAvailablePromotion(userId);
        res.status(200).json({
            status: 'success',
            message: "Available promotions fetched successfully",
            success: 'true',
            data: result,
        });
    } catch (error) {
        next(error)
    }
}

exports.applyPromotion = async (req, res, next) => {
    try {
        const { promotion_id } = req.body;
        const userId = req.user._id;

        if (!promotion_id)
            return res.status(400).json({ message: "promotion_id is required" });

        const result = await promotionService.applyPromotion(userId, promotion_id);

        return res.status(200).json({
            message: "Promotion applied successfully",
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            message: "Failed to apply promotion",
            error: error.message,
        });
    }
};

exports.claimPromotion = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const data = await promotionService.claimPromotion(userId, id);
        res.status(201).json({
            success: true,
            status: "success",
            message: "Promotion claimed successfully",
            data,
        });
    } catch (err) {
        next(err);
    }
};

exports.getUserClaimedPromotions = async (req, res) => {
    try {
        const userId = req.user._id;
        const data = await promotionService.getUserClaimedPromotions(userId);
        res.status(200).json({
            message: "Claimed promotions fetched successfully",
            data,
        });
    } catch (err) {
        res.status(400).json({
            message: err.message || "Failed to fetch claimed promotions",
        });
    }
};
