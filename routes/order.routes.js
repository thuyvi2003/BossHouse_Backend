const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const protectRoute = require("../middleware/auth.middleware")
router.post("/create",protectRoute(['user', 'veterinarian']),orderController.createOrder);
// router.get("/my", authMiddleware, orderController.getMyOrders);
// router.get("/:id", authMiddleware, orderController.getOrderDetail);
// router.patch("/:id/cancel", authMiddleware, orderController.cancelOrder);
router.get("/admin/all",protectRoute(['admin']), orderController.getAllOrders);

module.exports = router;
