const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const protectRoute = require("../middleware/auth.middleware")
//User area
router.post("/create",protectRoute(['user', 'veterinarian']),orderController.createOrder);
router.get("/my", protectRoute(['user', 'veterinarian']), orderController.getMyOrders);
//Admin area
router.get("/admin/all",protectRoute(['admin']), orderController.getAllOrders);
// router.get("/:id", authMiddleware, orderController.getOrderDetail);
// router.patch("/:id/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;
