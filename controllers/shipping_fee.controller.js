const { calculateShippingFee } = require("../services/calculateShippingFee");

exports.calculateShippingFee = async (req, res) => {
  try {
    const data = await calculateShippingFee(req.body);
    res.status(200).json({
      code: 200,
      message: "Success",
      data,
    });
  } catch (err) {
    console.error(" GHN Error:", err.message);
    res.status(400).json({
      code: 400,
      message: err.message || "Failed to calculate GHN fee",
    });
  }
};
