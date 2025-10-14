const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const protectRoute = require("../middleware/auth.middleware");

router.get("/", userController.getAllUsers);
router.get("/me", protectRoute(), userController.getCurrentUser);

module.exports = router;
