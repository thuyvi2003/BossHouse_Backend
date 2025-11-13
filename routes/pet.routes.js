const express = require("express");
const router = express.Router();
const petController = require("../controllers/pet.controller");
const protectRoute = require("../middleware/auth.middleware");

// CRUD + Filter/Search Pets
router.get("/", protectRoute(["user", "veterinarian"]), petController.getAllPets);
router.get("/my-pets", protectRoute(["user", "veterinarian"]), petController.getMyPets);
router.get("/:id", protectRoute(["user", "veterinarian"]), petController.getPetById);
router.post("/", protectRoute(["user", "veterinarian"]), petController.createPet);
router.put("/:id", protectRoute(["user", "veterinarian"]), petController.updatePet);
router.delete("/:id", protectRoute(["user", "veterinarian"]), petController.deletePet);

module.exports = router;
