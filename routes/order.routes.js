const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const protectRoute = require("../middleware/auth.middleware");

//User area
router.get("/vnpay_return", orderController.returnUrl);

router.post(
  "/create",
  protectRoute(["user", "veterinarian"]),
  orderController.createOrder
);
router.get(
  "/my",
  protectRoute(["user", "veterinarian"]),
  orderController.getMyOrders
);

//Admin area
router.get("/admin/all", protectRoute(["admin"]), orderController.getAllOrders);
router.get(
  "/admin/search",
  protectRoute(["admin"]),
  orderController.searchOrders
);

router.patch(
  "/:id/status",
  protectRoute(["admin"]),
  orderController.updateOrderStatus
);
router.patch(
  "/:id/cancel",
  protectRoute(["user", "admin"]),
  orderController.cancelOrder
);
router.get("/filter", protectRoute(["admin"]), orderController.filterOrders);
router.get(
  "/:id/export",
  protectRoute(["admin"]),
  orderController.exportOrderBill
);
router.get(
  "/:id",
  protectRoute(["user", "admin"]),
  orderController.getOrderDetail
);

module.exports = router;
