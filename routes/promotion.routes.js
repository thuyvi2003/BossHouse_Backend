//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');

//Router
router.post('/', promotionController.createPromotion);
router.get('/admin',promotionController.getAllPromotionsAdmin);
router.get('/user',promotionController.getAllPromotionsUser);

module.exports = router;