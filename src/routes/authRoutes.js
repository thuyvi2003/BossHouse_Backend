import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Route for handling user login
router.post("/login", login);

export default router;