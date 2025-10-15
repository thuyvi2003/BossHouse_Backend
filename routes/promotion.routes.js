//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');
const protectRoute = require('../middleware/auth.middleware');

//Router
router.post('/', promotionController.createPromotion);
router.get('/admin', protectRoute(['admin']), promotionController.getAllPromotionsAdmin);
router.get('/available', protectRoute(['user','veterinarian']),promotionController.getAvailablePromotion);
router.get('/claimed', protectRoute(['user','veterinarian']),promotionController.getUserClaimedPromotions);
router.get('/search', protectRoute(['admin']), promotionController.searchPromotion);
router.get('/user', protectRoute(['user', 'veterinarian']), promotionController.getAllPromotionsUser);
router.get('/:id', protectRoute(['admin']), promotionController.getPromotionById);
router.put('/:id', protectRoute(['admin']), promotionController.removePromotion);
router.post('/apply', protectRoute(['user','veterinarian']), promotionController.applyPromotion);
router.post('/:id/claim', protectRoute(['user','veterinarian']), promotionController.claimPromotion);


module.exports = router;