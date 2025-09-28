const express = require("express");
const { login, register, verify, resend, forgotPassword, resetPassword } = require("../controllers/auth.controller.js");

const router = express.Router();

// Route for handling user login
router.post("/login", login);
// Route for handling user registration
router.post("/register", register);
// Route for verifying OTP
router.post("/verify-otp", verify);
// Route for resending OTP
router.post("/resend-otp", resend);
// Route for initiating password reset
router.post("/forgot-password", forgotPassword);
// Route for resetting password
router.post("/reset-password", resetPassword);

module.exports = router;