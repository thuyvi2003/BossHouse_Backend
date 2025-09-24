const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    softDeleteCategory,
    hardDeleteCategory,
    searchCategories,
    getCategoryStats
} = require("../services/category.services.js");

// Create a new category
const createCategoryController = async (req, res) => {
    try {
        const { name, description, status, image } = req.body;
        const createdBy = req.user?.id; // Assuming user ID is available from auth middleware

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const result = await createCategory({
            name,
            description,
            status,
            image,
            createdBy
        });

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in createCategoryController:", error);
        
        if (error.message === "Category name already exists") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all categories with pagination, search, and filtering
const getAllCategoriesController = async (req, res) => {
    try {
        const queryParams = req.query;
        const result = await getAllCategories(queryParams);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllCategoriesController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get category by ID
const getCategoryByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getCategoryById(id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getCategoryByIdController:", error);
        
        if (error.message === "Category not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update category
const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const result = await updateCategory(id, updateData);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateCategoryController:", error);
        
        if (error.message === "Category not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Category name already exists") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Delete category (soft delete by default)
const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query;

        let result;
        if (hardDelete === 'true') {
            result = await hardDeleteCategory(id);
        } else {
            result = await softDeleteCategory(id);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteCategoryController:", error);
        
        if (error.message === "Category not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Search categories
const searchCategoriesController = async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const options = req.query;

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Search term is required"
            });
        }

        const result = await searchCategories(searchTerm, options);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in searchCategoriesController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get category statistics
const getCategoryStatsController = async (req, res) => {
    try {
        const result = await getCategoryStats();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getCategoryStatsController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController,
    searchCategoriesController,
    getCategoryStatsController
};
