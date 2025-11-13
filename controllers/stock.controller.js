const s = require("../services/stock.services.js");

const createStockController = async (req, res) => {
  try {
    const createdBy = req.user?.id;
    if (!createdBy) return res.status(401).json({ success: false, message: "Auth required" });
    const result = await s.createStock({ ...req.body, createdBy });
    res.status(201).json(result);
  } catch (e) {
    if ([
        "Invalid product/variation", "Product not found", "Product variation not found",
        "Stock cannot be negative"
      ].includes(e.message))
      return res.status(400).json({ success: false, message: e.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllStocksController = async (req, res) => {
  try { res.status(200).json(await s.getAllStocks(req.query)); }
  catch (e) { res.status(500).json({ success: false, message: "Server error" }); }
};

const getStockByIdController = async (req, res) => {
  try { res.status(200).json(await s.getStockById(req.params.id)); }
  catch (e) {
    if (e.message === "Stock entry not found")
      return res.status(404).json({ success: false, message: e.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateStockController = async (req, res) => {
  try { res.status(200).json(await s.updateStock(req.params.id, req.body)); }
  catch (e) {
    if (["Stock entry not found", "Product not found", "Product variation not found"].includes(e.message))
      return res.status(404).json({ success: false, message: e.message });
    if (e.message === "Stock cannot be negative")
      return res.status(400).json({ success: false, message: e.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteStockController = async (req, res) => {
  try { res.status(200).json(await s.softDeleteStock(req.params.id)); }
  catch (e) {
    if (["Stock entry not found", "Product not found", "Product variation not found"].includes(e.message))
      return res.status(404).json({ success: false, message: e.message });
    if (e.message === "Cannot delete stock entry: would result in negative stock")
      return res.status(400).json({ success: false, message: e.message });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getStockStatsController = async (req, res) => {
  try { res.status(200).json(await s.getStockStats()); }
  catch (e) { res.status(500).json({ success: false, message: "Server error" }); }
};

module.exports = {
  createStockController,
  getAllStocksController,
  getStockByIdController,
  updateStockController,
  deleteStockController,
  getStockStatsController,
};

