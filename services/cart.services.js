// Vo Lam Thuy Vi
const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
require('../models/productVariation.model');


exports.addToCart = async (userId, variationId, quantity) => {
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart.create({ user_id: userId })
    }

    let cartItem = await CartItem.findOne({ cart_id: cart._id, variation_id: variationId });

    if (cartItem) {
        cartItem.quantity += quantity;
        await cartItem.save();
    } else {
        cartItem = await CartItem.create({
            cart_id: cart._id,
            variation_id: variationId,
            quantity
        });
    }
    await cart.save();

    const populateCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    })
    return populateCart;
}