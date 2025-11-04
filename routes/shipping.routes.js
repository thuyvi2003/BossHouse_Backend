
const express = require("express");
const router = express.Router();
const shippingFeeController = require("../controllers/shipping_fee.controller.js");

router.post("/calculate-fee", shippingFeeController.calculateShippingFee);

module.exports = router;
