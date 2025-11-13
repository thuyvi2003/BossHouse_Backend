const petTypeService = require("../services/petType.service");

// Create Pet Type (Admin)
exports.createPetType = async (req, res) => {
  try {
    const newType = await petTypeService.createPetType(req.body);
    res.status(201).json({ status: "success", data: newType });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get All Pet Types (with filter/search)
exports.getAllPetTypes = async (req, res) => {
  try {
    const { search, active } = req.query;
    let filter = {};

    if (search) filter.name = new RegExp(search, "i");
    if (active !== undefined) filter.is_active = active === "true";

    const types = await petTypeService.getAllPetTypes(filter);
    res.status(200).json({ status: "success", data: types });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get Pet Type Detail
exports.getPetTypeById = async (req, res) => {
  try {
    const petType = await petTypeService.getPetTypeById(req.params.id);
    if (!petType)
      return res.status(404).json({ message: "Pet Type not found" });
    res.status(200).json({ status: "success", data: petType });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Update Pet Type (Admin)
exports.updatePetType = async (req, res) => {
  try {
    const updated = await petTypeService.updatePetType(req.params.id, req.body);
    if (!updated)
      return res.status(404).json({ message: "Pet Type not found" });
    res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Delete Pet Type (Admin)
exports.deletePetType = async (req, res) => {
  try {
    const deleted = await petTypeService.deletePetType(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Pet Type not found" });
    res.status(200).json({ status: "success", message: "Pet Type deleted" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Filter/Search Pet Types (Admin/Staff)
exports.filterPetType = async (req, res) => {
  try {
    const { name, is_active } = req.query;
    let filter = {};

    if (name) filter.name = new RegExp(name, "i");
    if (is_active !== undefined) filter.is_active = is_active === "true";

    const types = await petTypeService.getAllPetTypes(filter);
    res.status(200).json({ status: "success", data: types });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
