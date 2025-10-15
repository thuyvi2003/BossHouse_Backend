const wishlistService = require("../services/wishlist.services");

exports.addToWishlist = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { product_variation_id, note } = req.body;
        const result = await wishlistService.addToWishlist(user_id, product_variation_id, note)
        if (!result.success) return res.status(400).json(result);
        res.status(201).json({
            status: 'success',
            message: 'Add to wishlist is successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
exports.getWishlist = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const { wishlist, total } = await wishlistService.getWishlist(user_id);
        res.status(200).json({
            status: "success",
            message: "Get wishlist successfully",
            data: wishlist,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error)
    }
}

