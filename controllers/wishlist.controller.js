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
        const wishlist = await wishlistService.getWishlist(user_id);
        res.status(201).json({
            status: 'success',
            message: 'Get wishlist is successfully',
            data: wishlist
        });
    } catch (error) {
        next(error)
    }
}

