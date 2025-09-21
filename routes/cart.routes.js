//Vo Lam Thuy Vi
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

//Router
router.post('/add', cartController.addToCart);

module.exports = router;