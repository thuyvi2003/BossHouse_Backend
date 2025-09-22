//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

//Router
router.post('/add', cartController.addToCart);
//Thieu middleware decode token de lay userId
router.get('/', cartController.getCartsByUser);
router.put('/edit', cartController.editCartItemQuantity);

router.delete('/', function (req, res, next) {
    req.user_id = "66fd0f77a9c7d90f1a234123";
    next()
}, cartController.removeItem);

router.delete('/clear', function (req, res, next) {
    req.user_id = "66fd0f77a9c7d90f1a234123";
    next()
}, cartController.clearAllCart)
module.exports = router;