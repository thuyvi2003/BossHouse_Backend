const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    softDeleteProduct,
    hardDeleteProduct,
    searchProducts,
    getProductStats
} = require("../services/product.services.js");

// Create a new product
const createProductController = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, status, variations } = req.body;
        const createdBy = req.user?.id; // From auth middleware

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Handle image upload (from multer middleware)
        const imageData = req.file || req.body.image;

        const result = await createProduct({
            name,
            description,
            price,
            stock,
            categoryId,
            status,
            variations,
            createdBy
        }, imageData);

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in createProductController:", error);
        
        if (error.message === "Product name already exists in this category") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Category not found") {
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

// Get all products with pagination, search, and filtering
const getAllProductsController = async (req, res) => {
    try {
        const queryParams = req.query;
        const result = await getAllProducts(queryParams);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getAllProductsController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get product by ID
const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getProductById(id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getProductByIdController:", error);
        
        if (error.message === "Product not found") {
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

// Update product
const updateProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Handle image upload (from multer middleware)
        // Only use image data if there's actually a new file
        let imageData = null;
        if (req.file) {
            imageData = req.file;
        } else if (req.body.image && req.body.image !== '') {
            // Only use body image if it's not empty
            imageData = req.body.image;
        }
        
        console.log("Update product - Image data:", imageData ? "Present" : "None");
        
        const result = await updateProduct(id, updateData, imageData);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateProductController:", error);
        
        if (error.message === "Product not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Product name already exists in this category") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Category not found") {
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

// Delete product (soft delete by default)
const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query;

        let result;
        if (hardDelete === 'true') {
            result = await hardDeleteProduct(id);
        } else {
            result = await softDeleteProduct(id);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteProductController:", error);
        
        if (error.message === "Product not found") {
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

// Search products
const searchProductsController = async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const options = req.query;

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: "Search term is required"
            });
        }

        const result = await searchProducts(searchTerm, options);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in searchProductsController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get product statistics
const getProductStatsController = async (req, res) => {
    try {
        const result = await getProductStats();
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getProductStatsController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    updateProductController,
    deleteProductController,
    searchProductsController,
    getProductStatsController
};
