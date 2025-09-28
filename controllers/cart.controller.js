// Vo Lam Thuy Vi
const cartService = require('../services/cart.services');

exports.addToCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { variation_id, quantity } = req.body;
        const cart = await cartService.addToCart(userId, variation_id, quantity);
                if (cart == 0 ) res.status(400).json({code: 0})

        res.status(200).json({
            status: 'success',
            message: 'Add product to cart is successfully',
            data: cart
        });
    } catch (error) {
        next(error);
    }
}



exports.getCartsByUser = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const cartsList = await cartService.getCartsByUser(userId);
        res.status(200).json({
            status: 'success',
            message: 'Get cart successfully',
            data: cartsList
        });
    } catch (error) {
        next(error);
    }
}


exports.editCartItemQuantity = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const itemId = req.params.itemId;
        const { quantity } = req.body;
        const cartIsUpdated = await cartService.editCartItemQuantity(
            userId,
            itemId,
            quantity
        );
        res.status(200).json({
            status: 'success',
            message: 'Update quantity successfully',
            data: cartIsUpdated
        });
    } catch (error) {
        next(error);
    }
};


exports.removeItem = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { variation_id } = req.body;
        const deleted = await cartService.removeItem(user_id, variation_id)
        res.status(200).json({
            status: 'success',
            message: 'Remove item successfully',
            data: deleted
        });
    } catch (error) {
        next(error)
    }
}



exports.clearAllCart = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const cartClear = await cartService.clearAllCart(user_id);
        res.status(200).json({
            status: 'success',
            message: 'Clear all cart successfully',
            data: cartClear
        });
    } catch (error) {
        next(error)
    }
}