const Pet = require("../models/pet.model");

exports.getAllPets = async (req, res) => {
  try {
    const pets = await Pet.find();
    res.status(200).json({ status: "success", data: pets });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createPet = async (req, res) => {
  try {
    const { name, species, user_id } = req.body;
    const newPet = await Pet.create({ name, species, user_id });
    res.status(201).json({ status: "success", data: newPet });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
