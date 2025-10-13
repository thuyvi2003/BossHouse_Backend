const express = require("express");
const router = express.Router();
const petController = require("../controllers/pet.controller");
const protectRoute = require("../middleware/auth.middleware"); // nếu muốn bảo vệ route

router.get("/", petController.getAllPets);
router.post("/", protectRoute(), petController.createPet);

module.exports = router;
