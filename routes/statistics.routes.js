const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/auth.middleware");
const statisticsController = require("../controllers/statistics.controller");

// Admin and Staff only
const adminRoles = ["admin", "staff"];

router.get(
  "/revenue",
  protectRoute(adminRoles),
  statisticsController.getRevenueStats
);

module.exports = router;