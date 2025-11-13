const { getRevenueStatistics } = require("../services/statistics.service");

exports.getRevenueStats = async (req, res) => {
  try {
    const { start_date, end_date, category_id, payment_method } = req.query;

    const data = await getRevenueStatistics({
      startDate: start_date,
      endDate: end_date,
      categoryId: category_id,
      paymentMethod: payment_method,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getRevenueStats controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue statistics",
      error: error.message,
    });
  }
};