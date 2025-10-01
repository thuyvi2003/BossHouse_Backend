//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const protectRoute = require('../middleware/auth.middleware');

//Router
router.post('/', promotionController.createPromotion);
router.get('/admin', protectRoute(['admin']), promotionController.getAllPromotionsAdmin);
router.get('/user', protectRoute(['user', 'veterinarian']), promotionController.getAllPromotionsUser);
router.get('/:id', protectRoute(['admin']), promotionController.getPromotionById);
router.put('/:id', protectRoute(['admin']), promotionController.removePromotion);
router.get('/', protectRoute(['admin']), promotionController.searchPromotion);

module.exports = router;