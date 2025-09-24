const Service = require("../models/service.model");

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json({ status: "success", data: services });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
