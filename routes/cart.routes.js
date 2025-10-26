//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const protectRoute = require('../middleware/auth.middleware');

//Router
router.post('/add', protectRoute(['user', 'veterinarian']), cartController.addToCart);
router.get('/', protectRoute(['user', 'veterinarian']), cartController.getCartsByUser);
router.put('/:itemId', protectRoute(['user', 'veterinarian']), cartController.editCartItemQuantity);
router.delete('/', protectRoute(['user', 'veterinarian']), cartController.removeItem);
router.delete('/clear', protectRoute(['user', 'veterinarian']), cartController.clearAllCart)
module.exports = router;