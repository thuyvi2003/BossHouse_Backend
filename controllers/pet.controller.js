const Pet = require("../models/pet.model");

exports.getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find();
    res.status(200).json({ status: "success", data: pets });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
