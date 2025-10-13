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

// controllers/user.controller.js
exports.getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // middleware đã gán user
    if (!user) return res.status(401).json({ status: "error", message: "Not authenticated" });
    
    res.status(200).json({ _id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
