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

// Validation rules
const createProductValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("categoryId").isMongoId().withMessage("Invalid category ID"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
  body("variations")
    .optional()
    .isArray()
    .withMessage("Variations must be an array"),
  body("variations.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Variation name must be between 1 and 100 characters"),
  body("variations.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variation price must be a number greater than or equal to 0"),
  body("variations.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variation stock must be a non-negative integer"),
  body("variations.*.color")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Color cannot exceed 50 characters"),
  body("variations.*.size")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Size cannot exceed 50 characters"),
];

const updateProductValidation = [
  param("id").isMongoId().withMessage("Invalid product ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("categoryId").optional().isMongoId().withMessage("Invalid category ID"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
  body("variations")
    .optional()
    .isArray()
    .withMessage("Variations must be an array"),
  body("variations.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Variation name must be between 1 and 100 characters"),
  body("variations.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Variation price must be a number greater than or equal to 0"),
  body("variations.*.stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Variation stock must be a non-negative integer"),
  body("variations.*.color")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Color cannot exceed 50 characters"),
  body("variations.*.size")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Size cannot exceed 50 characters"),
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
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),
  query("categoryId").optional().isMongoId().withMessage("Invalid category ID"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a non-negative number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a non-negative number"),
  query("minStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum stock must be a non-negative integer"),
  query("maxStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum stock must be a non-negative integer"),
  query("createdBy").optional().isMongoId().withMessage("Invalid createdBy ID"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "stock", "created_at", "updated_at", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either asc or desc"),
];

const searchProductsValidation = [
  query("q")
    .trim()
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("categoryId").optional().isMongoId().withMessage("Invalid category ID"),
  query("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be either active or inactive"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be a non-negative number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be a non-negative number"),
  query("sortBy")
    .optional()
    .isIn(["name", "price", "stock", "created_at", "updated_at", "status"])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be either asc or desc"),
];

// Routes

// POST /products - Create a new product
router.post(
  "/",
  protectRoute, // Authentication required
  uploadSingle("image"), // Handle single image upload
  handleUploadError, // Handle upload errors
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
  protectRoute, // Authentication required
  uploadSingle("image"), // Handle single image upload
  handleUploadError, // Handle upload errors
  updateProductValidation,
  handleValidationErrors,
  updateProductController
);

// DELETE /products/:id - Delete product (soft delete by default, hard delete with ?hardDelete=true)
router.delete(
  "/:id",
  protectRoute, // Authentication required
  deleteProductValidation,
  handleValidationErrors,
  deleteProductController
);

module.exports = router;
