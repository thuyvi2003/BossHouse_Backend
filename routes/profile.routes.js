const express = require("express");
const { changePassword, deleteAccount, getLoginHistory, getProfile, updateProfile, uploadAvatar } = require("../controllers/profile.controller.js");
const protectRoute = require("../middleware/auth.middleware.js");
const { uploadSingle } = require("../middleware/upload.middleware.js");


const router = express.Router();

router.post("/change-password", protectRoute(), changePassword);
router.delete("/delete-account", protectRoute(), deleteAccount);
router.get("/login-history", protectRoute(), getLoginHistory);
router.get("/", protectRoute(), getProfile);
router.put("/", protectRoute(), updateProfile);
router.post("/avatar", protectRoute(), uploadSingle("avatar"), uploadAvatar);


module.exports = router;