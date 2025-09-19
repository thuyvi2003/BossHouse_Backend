//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');

//Router
router.post('/', promotionController.createPromotion);
router.get('/',promotionController.getAllPromotionsAdmin);
router.get('/',promotionController.getAllPromotionsUser);