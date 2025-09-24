const {
    createProductVariation,
    getProductVariations,
    getVariationById,
    updateProductVariation,
    softDeleteProductVariation,
    hardDeleteProductVariation,
    getVariationStats
} = require("../services/productVariation.services.js");

// Create a new product variation
const createProductVariationController = async (req, res) => {
    try {
        const { productId } = req.params;
        const { name, price, stock, status } = req.body;
        const createdBy = req.user?.id; // From auth middleware

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Handle image upload (from multer middleware)
        const imageData = req.file || req.body.image;

        const result = await createProductVariation(productId, {
            name,
            price,
            stock,
            status,
            createdBy
        }, imageData);

        res.status(201).json(result);
    } catch (error) {
        console.error("Error in createProductVariationController:", error);
        
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

// Get all variations for a product
const getProductVariationsController = async (req, res) => {
    try {
        const { productId } = req.params;
        const result = await getProductVariations(productId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getProductVariationsController:", error);
        
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

// Get variation by ID
const getVariationByIdController = async (req, res) => {
    try {
        const { variationId } = req.params;
        const result = await getVariationById(variationId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getVariationByIdController:", error);
        
        if (error.message === "Product variation not found") {
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

// Update product variation
const updateProductVariationController = async (req, res) => {
    try {
        const { variationId } = req.params;
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
        
        console.log("Update variation - Image data:", imageData ? "Present" : "None");
        
        const result = await updateProductVariation(variationId, updateData, imageData);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateProductVariationController:", error);
        
        if (error.message === "Product variation not found") {
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

// Delete product variation (soft delete by default)
const deleteProductVariationController = async (req, res) => {
    try {
        const { variationId } = req.params;
        const { hardDelete = false } = req.query;

        let result;
        if (hardDelete === 'true') {
            result = await hardDeleteProductVariation(variationId);
        } else {
            result = await softDeleteProductVariation(variationId);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error in deleteProductVariationController:", error);
        
        if (error.message === "Product variation not found") {
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

// Get variation statistics
const getVariationStatsController = async (req, res) => {
    try {
        const { productId } = req.query;
        const result = await getVariationStats(productId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in getVariationStatsController:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = {
    createProductVariationController,
    getProductVariationsController,
    getVariationByIdController,
    updateProductVariationController,
    deleteProductVariationController,
    getVariationStatsController
};
