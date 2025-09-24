// controllers/vet.controller.js
const Veterinarian = require("../models/veterinarian.model");

exports.getAllVeterinarians = async (req, res) => {
  try {
    const vets = await Veterinarian.find()
      .populate("user_id", "name email"); // lấy thêm tên + email của user

    res.status(200).json({ status: "success", data: vets });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


