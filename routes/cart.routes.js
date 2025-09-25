//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const protectRoute = require('../middleware/auth.middleware');

//Router
router.post('/', protectRoute(), cartController.addToCart);
//Thieu middleware decode token de lay userId
router.get('/', protectRoute(), cartController.getCartsByUser);
router.put('/', protectRoute(), cartController.editCartItemQuantity);
router.delete('/',protectRoute(), cartController.removeItem);
router.delete('/clear', function (req, res, next) {
    req.user_id = "66f32e9a25208e1c4b89ea01";
    next()
}, cartController.clearAllCart)
module.exports = router;