//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const protectRoute = require('../middleware/auth.middleware');

//Router
router.post('/', protectRoute(['admin']), promotionController.createPromotion);
router.get('/admin', protectRoute(['admin']), promotionController.getAllPromotionsAdmin);
router.get('/user', protectRoute(['user', 'veterinarian']), promotionController.getAllPromotionsUser);

module.exports = router;