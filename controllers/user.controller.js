// controllers/user.controller.js
const User = require("../models/user.model");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ status: "success", data: users });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
