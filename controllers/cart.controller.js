// Vo Lam Thuy Vi
const cartService = require('../services/cart.services');

exports.addToCart = async (req, res, next) => {
    try {
        const { user_id,variation_id, quantity } = req.body;
               const cart = await cartService.addToCart(user_id, variation_id, quantity);
        res.status(200).json({
            status: 'success',
            data: cart
        });
    } catch (error) {
        next(error);
    }
}