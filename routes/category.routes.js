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

// Validation rules
const createCategoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    body('image')
        .optional()
        .isURL()
        .withMessage('Image must be a valid URL')
];

const updateCategoryValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid category ID'),
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Description cannot exceed 200 characters'),
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    body('image')
        .optional()
        .isURL()
        .withMessage('Image must be a valid URL')
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

const getAllCategoriesValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Search term must be between 1 and 50 characters'),
    query('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    query('sortBy')
        .optional()
        .isIn(['name', 'created_at', 'updated_at', 'status'])
        .withMessage('Invalid sort field'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
];

const searchCategoriesValidation = [
    query('q')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Search query must be between 1 and 50 characters'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be either active or inactive'),
    query('sortBy')
        .optional()
        .isIn(['name', 'created_at', 'updated_at', 'status'])
        .withMessage('Invalid sort field'),
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be either asc or desc')
];

// Routes

// POST /categories - Create a new category
router.post(
    "/",
    protectRoute,             // user phải login
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
    protectRoute,
    updateCategoryValidation,
    handleValidationErrors,
    updateCategoryController
);

// DELETE /categories/:id - Delete category (soft delete by default, hard delete with ?hardDelete=true)
router.delete(
    "/:id",
    protectRoute,
    deleteCategoryValidation,
    handleValidationErrors,
    deleteCategoryController
);

module.exports = router;
