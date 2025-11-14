const express = require("express");
const router = express.Router();
const petTypeController = require("../controllers/petType.controller");
const protectRoute = require("../middleware/auth.middleware");

// ============================
// Pet Type Management
// ============================

// View list of pet types (Admin, Staff, Veterinarian, User)
router.get(
  "/",
  protectRoute(["admin", "staff", "veterinarian", "user"]),
  petTypeController.getAllPetTypes
);

// View pet type detail (Admin, Staff, Veterinarian, User, Guest)
router.get(
  "/:id",
  protectRoute(["admin", "staff", "veterinarian", "user", "guest"]),
  petTypeController.getPetTypeById
);

// Create new pet type (Admin)
router.post(
  "/",
  protectRoute(["admin"]),
  petTypeController.createPetType
);

// Update pet type (Admin)
router.put(
  "/:id",
  protectRoute(["admin"]),
  petTypeController.updatePetType
);

// Delete pet type (Admin)
router.delete(
  "/:id",
  protectRoute(["admin"]),
  petTypeController.deletePetType
);

// Filter/Search pet type (Admin/Staff)
router.get(
  "/filter/search",
  protectRoute(["admin", "staff"]),
  petTypeController.filterPetType
);

module.exports = router;
