const express = require("express");
const {
    getAccounts,
    getAccountDetail,
    assignRole,
    banUnbanAccount,
} = require("../controllers/accountManagement.controller.js");
const protectRoute = require("../middleware/auth.middleware.js");

const router = express.Router();

// Protect all routes with admin role
router.use(protectRoute(["admin"]));

// GET /api/admin/account-management/accounts - List with filters/pagination
router.get("/accounts", getAccounts);

// GET /api/admin/account-management/accounts/:id - Detail
router.get("/accounts/:id", getAccountDetail);

// PUT /api/admin/account-management/accounts/:id/role - Assign role
router.put("/accounts/:id/role", assignRole);

// PUT /api/admin/account-management/accounts/:id/ban - Ban/unban
router.put("/accounts/:id/ban", banUnbanAccount);

module.exports = router;