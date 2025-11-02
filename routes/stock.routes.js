const express = require("express");
const { body, param } = require("express-validator");
const c = require("../controllers/stock.controller.js");
const auth = require("../middleware/auth.middleware");
const router = express.Router();

const validateType = [body("type").isIn(["import", "adjustment", "return"])];
const validateId = [param("id").isMongoId()];

router.post("/", auth(["admin"]), validateType, c.createStockController);
router.get("/", auth(["admin"]), c.getAllStocksController);
router.get("/stats", auth(["admin"]), c.getStockStatsController);
router.get("/:id", auth(["admin"]), validateId, c.getStockByIdController);
router.put("/:id", auth(["admin"]), validateId, c.updateStockController);
router.delete("/:id", auth(["admin"]), validateId, c.deleteStockController);

module.exports = router;

