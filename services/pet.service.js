const Pet = require("../models/pet.model");
const PetType = require("../models/petType.model");

// Helper
const normalizeGender = (gender) => {
  if (!gender) return undefined;
  const map = { male: "Male", female: "Female", other: "Other" };
  return map[gender.toLowerCase()] || undefined;
};

// Convert species name to ObjectId
const resolveSpeciesId = async (species) => {
  if (!species) return undefined;
  if (typeof species === "string") {
    const petType = await PetType.findOne({ name: species });
    if (petType) return petType._id;
  }
  return species; // already ObjectId
};

// Create Pet
exports.createPet = async (data) => {
  if (data.gender) data.gender = normalizeGender(data.gender);
  data.species = await resolveSpeciesId(data.species);
  return await Pet.create(data);
};

// Get all pets with filter
exports.getAllPets = async (filter = {}) => {
  if (filter.gender) filter.gender = normalizeGender(filter.gender);
  if (filter.species) filter.species = await resolveSpeciesId(filter.species);

  return await Pet.find(filter)
    .populate("user_id", "name email")
    .populate("species", "name description");
};

// Get pets of specific user
exports.getMyPets = async (userId) => {
  return await Pet.find({ user_id: userId })
    .populate("user_id", "name email")
    .populate("species", "name description");
};

// Get by ID
exports.getPetById = async (id) => {
  return await Pet.findById(id)
    .populate("user_id", "name email")
    .populate("species", "name description");
};

// Update Pet
exports.updatePet = async (id, data) => {
  if (data.gender) data.gender = normalizeGender(data.gender);
  if (data.species) data.species = await resolveSpeciesId(data.species);

  return await Pet.findByIdAndUpdate(id, data, { new: true });
};

// Delete Pet
exports.deletePet = async (id) => {
  return await Pet.findByIdAndDelete(id);
};
