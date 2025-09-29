// Vo Lam Thuy Vi
const Cart = require('../models/cart.model');
const CartItem = require('../models/cartItem.model');
require('../models/productVariation.model');
const mongoose = require('mongoose');
const ProductVariation = require('../models/productVariation.model');

exports.addToCart = async (userId, variationId, quantity) => {
    let cart = await Cart.findOne({ user_id: userId });

    const listCart = await CartItem.find({cart_id: cart._id })
    if(listCart.length == 5 ) { 
    return 0;

    }
    //Check status variation
    const variation = await ProductVariation.findOne({
        _id: variationId,
        status: 'active',
        isDeleted: false
    });
    if (!variation) throw new Error("Variation not found or inactive");

    //Check stock of variation
    if (variation.stock < quantity) {
        throw new Error(`Not enough stock. Only ${variation.stock} left`);
    }

    //Check cart is exists or does not exists
    // If cart does not exists
    if (!cart) {
        cart = await Cart.create({ user_id: userId })
    }

    // If cart exists 
    let cartItem = await CartItem.findOne({ cart_id: cart._id, variation_id: variationId });

    if (cartItem) {
        if (variation.stock < cartItem.quantity + quantity) {
            throw new Error(`Not enough stock. Only ${variation.stock} left`);
        }
        cartItem.quantity += quantity;
        await cartItem.save();
    } else {
        cartItem = await CartItem.create({
            cart_id: cart._id,
            variation_id: variationId,
            quantity
        });
    }
    //Populate cart de tra ve 
    const populateCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    })
    return populateCart;
}



exports.getCartsByUser = async (userId) => {
    const cart = await Cart.findOne({ user_id: userId }).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    })
    return cart;
}




exports.editCartItemQuantity = async (userId, itemId, newQuantity) => {
    //Check cart is exists or does not exists
    const cart = await Cart.findOne({ user_id: userId });
    //Cart does not exists
    if (!cart) throw new Error("Cart not found!!");
    
    //Cart exists, find cartItem exists or does not exists
    const cartItem = await CartItem.findOne({ _id: itemId, cart_id: cart._id });
    //CartItem does not exists
    if (!cartItem)  throw new Error("Cart item not found!");
    //CartItem exists
    const variation = await ProductVariation.findById(cartItem.variation_id);
    //Variation not found
    if(!variation) throw new Error("Variation not found!");
    //Variation is founded
    if(newQuantity > variation.stock) {
            throw new Error(`Not enough stock. Only ${variation.stock} left`);
    }
    //If newQuantity nho hon or bang 0 thi xoa luon
    if (newQuantity <= 0) {
        await CartItem.deleteOne({ _id: itemId });
    } else {
        cartItem.quantity = newQuantity; //Lon hon 0 thi lay gia tri moi gan vao va save
        await cartItem.save();
    }

    //Populate de tra ve 
    const updatedCart = await Cart.findById(cart._id).populate({
        path: 'items',
        populate: { path: 'variation_id' }
    });

    return updatedCart;
};





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
