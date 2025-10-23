const express = require("express");
const { changePassword, deleteAccount, getLoginHistory } = require("../controllers/profile.controller.js");
const protectRoute = require("../middleware/auth.middleware.js");

const router = express.Router();

router.post("/change-password", protectRoute(), changePassword);
router.delete("/delete-account", protectRoute(), deleteAccount);
router.get("/login-history", protectRoute(), getLoginHistory);


module.exports = router;