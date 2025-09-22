// Vo Lam Thuy Vi
const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
require('../models/productVariation.model');
const mongoose = require('mongoose')

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
exports.getCartsByUser = async (userId) => {
    const cartList = await Cart.find({ user_id: userId }).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    })
    return cartList;
}
exports.editCartItemQuantity = async (userId, itemId, newQuantity) => {
    const cart = await Cart.findOne({ user_id: userId })
    if (!cart) {
        throw new Error("Cart not found!!")
    }
    const cartItem = await CartItem.findOne({ _id: itemId, cart_id: cart._id })
    if (!cartItem) {
        throw new Error("Cart not found!!!!!!!!!!")
    }

    if (newQuantity <= 0) {
        await CartItem.deleteOne({ _id: itemId })
    } else {
        cartItem.quantity = newQuantity;
    }
    await cartItem.save();
    const updatedCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    })
    return updatedCart;
}
exports.removeItem = async (userId, variationId) => {
    const cart = await Cart.findOne({ user_id: userId })
    if (!cart) {
        throw new Error("Cart not found!!!");
    }
    const deleted = await CartItem.findOneAndDelete({ cart_id: cart._id, variation_id: variationId })
    if (!deleted) {
        throw new Error("Cart item not found!")
    }
    return;
}
exports.clearAllCart = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        throw new Error("Cart not found!!!");
    }
    await CartItem.deleteMany({ cart_id: cart._id })
    cart.original_price = 0;
    cart.promotion_amount = 0;
    cart.total_price = 0;
    await cart.save();
    return cart;
}
