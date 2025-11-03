const express = require("express");
const { changePassword, deleteAccount, getLoginHistory, getProfile, updateProfile, uploadAvatar, linkGoogle, unlinkGoogle } = require("../controllers/profile.controller.js");
const protectRoute = require("../middleware/auth.middleware.js");
const { uploadSingle } = require("../middleware/upload.middleware.js");


const router = express.Router();

router.post("/change-password", protectRoute(), changePassword);
router.delete("/delete-account", protectRoute(), deleteAccount);
router.get("/login-history", protectRoute(), getLoginHistory);
router.get("/", protectRoute(), getProfile);
router.put("/", protectRoute(), updateProfile);
router.post("/avatar", protectRoute(), uploadSingle("avatar"), uploadAvatar);
router.post("/link-google", protectRoute(), linkGoogle);
router.delete("/unlink-google", protectRoute(), unlinkGoogle);


module.exports = router;