const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  searchProductsController,
  getProductStatsController,
} = require("../controllers/product.controller.js");
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
const createProductValidation = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("categoryId").isMongoId().withMessage("Invalid category ID"),
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];

const getProductByIdValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
];

const deleteProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  query("hardDelete")
    .optional()
    .isBoolean()
    .withMessage("hardDelete must be a boolean value"),
];

const getAllProductsValidation = [
  query("categoryId").optional().isMongoId().withMessage("Invalid category ID"),
];

const searchProductsValidation = [
  query("q").trim().notEmpty().withMessage("Search query is required"),
];

// Routes

// POST /products - Create a new product
router.post(
  "/",
  protectRoute(['admin']),  
  uploadSingle("image"),  
  handleUploadError,  
  createProductValidation,
  handleValidationErrors,
  createProductController
);

// GET /products - Get all products with pagination, search, and filtering
router.get(
  "/",
  getAllProductsValidation,
  handleValidationErrors,
  getAllProductsController
);

// GET /products/stats - Get product statistics
router.get("/stats", getProductStatsController);

// GET /products/search - Search products
router.get(
  "/search",
  searchProductsValidation,
  handleValidationErrors,
  searchProductsController
);

// GET /products/:id - Get product by ID
router.get(
  "/:id",
  getProductByIdValidation,
  handleValidationErrors,
  getProductByIdController
);

// PUT /products/:id - Update product
router.put(
  "/:id",
  protectRoute(['admin']),  
  uploadSingle("image"),  
  handleUploadError,  
  updateProductValidation,
  handleValidationErrors,
  updateProductController
);

// DELETE /products/:id - Delete product (soft delete by default, hard delete with ?hardDelete=true)
router.delete(
  "/:id",
  protectRoute(['admin']),
  deleteProductValidation,
  handleValidationErrors,
  deleteProductController
);

module.exports = router;
