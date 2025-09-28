const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const {
  createProductVariationController,
  getProductVariationsController,
  getVariationByIdController,
  updateProductVariationController,
  deleteProductVariationController,
  getVariationStatsController,
} = require("../controllers/productVariation.controller.js");
const protectRoute = require("../middleware/auth.middleware");
const { uploadSingle, handleUploadError } = require("../middleware/upload.middleware");

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Validation rules - Simplified
const createProductVariationValidation = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("name").trim().notEmpty().withMessage("Variation name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
];

const updateProductVariationValidation = [
  param("variationId").isMongoId().withMessage("Invalid variation ID"),
];

const getProductVariationsValidation = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
];

const getVariationByIdValidation = [
  param("variationId").isMongoId().withMessage("Invalid variation ID"),
];

const deleteProductVariationValidation = [
  param("variationId").isMongoId().withMessage("Invalid variation ID"),
  query("hardDelete")
    .optional()
    .isBoolean()
    .withMessage("hardDelete must be a boolean value"),
];

const getVariationStatsValidation = [];

// Routes

// POST /products/:productId/variations - Create a new product variation
router.post(
  "/:productId/variations",
  protectRoute(['admin']),
  uploadSingle("image"), 
  handleUploadError,
  createProductVariationValidation,
  handleValidationErrors,
  createProductVariationController
);

// GET /products/:productId/variations - Get all variations for a product
router.get(
  "/:productId/variations",
  getProductVariationsValidation,
  handleValidationErrors,
  getProductVariationsController
);

// GET /variations/stats - Get variation statistics
router.get(
  "/stats",
  getVariationStatsValidation,
  handleValidationErrors,
  getVariationStatsController
);

// GET /variations/:variationId - Get variation by ID
router.get(
  "/:variationId",
  getVariationByIdValidation,
  handleValidationErrors,
  getVariationByIdController
);

// PUT /variations/:variationId - Update product variation
router.put(
  "/:variationId",
  protectRoute(['admin']), 
  uploadSingle("image"), 
  handleUploadError, 
  updateProductVariationValidation,
  handleValidationErrors,
  updateProductVariationController
);

// DELETE /variations/:variationId - Delete product variation (soft delete by default, hard delete with ?hardDelete=true)
router.delete(
  "/:variationId",
  protectRoute(['admin']),
  deleteProductVariationValidation,
  handleValidationErrors,
  deleteProductVariationController
);

module.exports = router;
