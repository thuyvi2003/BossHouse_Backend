const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const {
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController,
    searchCategoriesController,
    getCategoryStatsController
} = require("../controllers/category.controller.js");
const protectRoute = require("../middleware/auth.middleware");

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }
    next();
};

// Validation rules - Simplified
const createCategoryValidation = [
    body('name').trim().notEmpty().withMessage('Category name is required')
];

const updateCategoryValidation = [
    param('id').isMongoId().withMessage('Invalid category ID')
];

const getCategoryByIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid category ID')
];

const deleteCategoryValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid category ID'),
    query('hardDelete')
        .optional()
        .isBoolean()
        .withMessage('hardDelete must be a boolean value')
];

const getAllCategoriesValidation = [];

const searchCategoriesValidation = [
    query('q').trim().notEmpty().withMessage('Search query is required')
];

// Routes

// POST /categories - Create a new category
router.post(
    "/",
    protectRoute(['admin']),
    createCategoryValidation,
    handleValidationErrors,
    createCategoryController
);

// GET /categories - Get all categories with pagination, search, and filtering
router.get(
    "/",
    getAllCategoriesValidation,
    handleValidationErrors,
    getAllCategoriesController
);

// GET /categories/stats - Get category statistics
router.get(
    "/stats",
    getCategoryStatsController
);

// GET /categories/search - Search categories
router.get(
    "/search",
    searchCategoriesValidation,
    handleValidationErrors,
    searchCategoriesController
);

// GET /categories/:id - Get category by ID
router.get(
    "/:id",
    getCategoryByIdValidation,
    handleValidationErrors,
    getCategoryByIdController
);

// PUT /categories/:id - Update category
router.put(
    "/:id",
    protectRoute(['admin']),
    updateCategoryValidation,
    handleValidationErrors,
    updateCategoryController
);

// DELETE /categories/:id - Delete category (soft delete by default, hard delete with ?hardDelete=true)
router.delete(
    "/:id",
    protectRoute(['admin']),
    deleteCategoryValidation,
    handleValidationErrors,
    deleteCategoryController
);

module.exports = router;
