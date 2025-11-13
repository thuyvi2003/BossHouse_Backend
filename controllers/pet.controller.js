const petService = require("../services/pet.service");
const PetType = require("../models/petType.model");

// Helper
const normalizeGender = (g) => {
  if (!g) return undefined;
  const map = { male: "Male", female: "Female", other: "Other" };
  return map[g.toLowerCase()] || g;
};

// Create Pet
exports.createPet = async (req, res) => {
  try {
    const petData = {
      ...req.body,
      user_id: req.user?._id || req.body.user_id,
    };
    const newPet = await petService.createPet(petData);
    res.status(201).json({ status: "success", data: newPet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get all pets
exports.getAllPets = async (req, res) => {
  try {
    const { search, species, gender, active } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { breed: new RegExp(search, "i") },
      ];
    }

    if (species) filter.species = species; // can be name or ObjectId
    if (gender) filter.gender = normalizeGender(gender);
    if (active !== undefined) filter.is_active = active === "true";

    const pets = await petService.getAllPets(filter);
    res.status(200).json({ status: "success", data: pets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get my pets
exports.getMyPets = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const pets = await petService.getMyPets(req.user._id);
    res.status(200).json({ status: "success", data: pets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get Pet by ID
exports.getPetById = async (req, res) => {
  try {
    const pet = await petService.getPetById(req.params.id);
    if (!pet) return res.status(404).json({ status: "error", message: "Pet not found" });
    res.status(200).json({ status: "success", data: pet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Update Pet
exports.updatePet = async (req, res) => {
  try {
    const updated = await petService.updatePet(req.params.id, req.body);
    if (!updated) return res.status(404).json({ status: "error", message: "Pet not found" });
    res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Delete Pet
exports.deletePet = async (req, res) => {
  try {
    const deleted = await petService.deletePet(req.params.id);
    if (!deleted) return res.status(404).json({ status: "error", message: "Pet not found" });
    res.status(200).json({ status: "success", message: "Pet deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
};
