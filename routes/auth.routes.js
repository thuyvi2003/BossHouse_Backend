const express = require("express");
const { login } = require("../controllers/auth.controller.js");

const router = express.Router();

// Route for handling user login
router.post("/login", login);

module.exports = router;
