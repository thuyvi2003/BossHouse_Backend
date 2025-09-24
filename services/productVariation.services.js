const ProductVariation = require("../models/productVariation.model.js");
const Product = require("../models/product.model.js");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service.js");

// Create a new product variation
const createProductVariation = async (productId, variationData, imageData) => {
  try {
    const { name, price, stock, status, createdBy } = variationData;

    // Check if product exists
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Upload image to Cloudinary if provided
    let imageUrl = "";
    if (imageData) {
      imageUrl = await uploadToCloudinary(imageData, "product-variations");
    }

    const newVariation = new ProductVariation({
      product_id: productId,
      name,
      price,
      stock,
      image: imageUrl,
      status: status || "active",
      createdBy,
    });

    const savedVariation = await newVariation.save();

    // Update product stock from variations
    await product.updateStockFromVariations();

    // Populate the saved variation
    const populatedVariation = await ProductVariation.findById(
      savedVariation._id
    )
      .populate("product_id", "name sku")
      .populate("createdBy", "name email");

    return {
      success: true,
      data: populatedVariation,
      message: "Product variation created successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Get all variations for a product
const getProductVariations = async (productId) => {
  try {
    // Check if product exists
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const variations = await ProductVariation.findByProductId(
      productId
    ).populate("createdBy", "name email");

    return {
      success: true,
      data: variations,
    };
  } catch (error) {
    throw error;
  }
};

// Get variation by ID
const getVariationById = async (variationId) => {
  try {
    const variation = await ProductVariation.findOne({
      _id: variationId,
      isDeleted: false,
    })
      .populate("product_id", "name sku")
      .populate("createdBy", "name email");

    if (!variation) {
      throw new Error("Product variation not found");
    }

    return {
      success: true,
      data: variation,
    };
  } catch (error) {
    throw error;
  }
};

// Update product variation
const updateProductVariation = async (variationId, updateData, imageData) => {
  try {
    const { name, price, stock, status } = updateData;

    // Check if variation exists
    const existingVariation = await ProductVariation.findOne({
      _id: variationId,
      isDeleted: false,
    });

    if (!existingVariation) {
      throw new Error("Product variation not found");
    }

    // Handle image update
    let imageUrl = existingVariation.image;
    if (imageData) {
      // Delete old image from Cloudinary
      if (existingVariation.image) {
        await deleteFromCloudinary(existingVariation.image);
      }
      // Upload new image
      imageUrl = await uploadToCloudinary(imageData, "product-variations");
    }

    // Build update object
    const updateObject = {};
    if (name !== undefined) updateObject.name = name;
    if (price !== undefined) updateObject.price = price;
    if (stock !== undefined) updateObject.stock = stock;
    if (status !== undefined) updateObject.status = status;
    if (imageData) updateObject.image = imageUrl;

    const updatedVariation = await ProductVariation.findByIdAndUpdate(
      variationId,
      updateObject,
      { new: true, runValidators: true }
    )
      .populate("product_id", "name sku")
      .populate("createdBy", "name email");

    // Update product stock from variations
    const product = await Product.findById(existingVariation.product_id);
    if (product) {
      await product.updateStockFromVariations();
    }

    return {
      success: true,
      data: updatedVariation,
      message: "Product variation updated successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Soft delete product variation
const softDeleteProductVariation = async (variationId) => {
  try {
    const variation = await ProductVariation.findOne({
      _id: variationId,
      isDeleted: false,
    });

    if (!variation) {
      throw new Error("Product variation not found");
    }

    // Soft delete variation
    await ProductVariation.findByIdAndUpdate(variationId, { isDeleted: true });

    // Update product stock from variations
    const product = await Product.findById(variation.product_id);
    if (product) {
      await product.updateStockFromVariations();
    }

    return {
      success: true,
      message: "Product variation deleted successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Hard delete product variation
const hardDeleteProductVariation = async (variationId) => {
  try {
    const variation = await ProductVariation.findOne({
      _id: variationId,
      isDeleted: false,
    });

    if (!variation) {
      throw new Error("Product variation not found");
    }

    // Delete image from Cloudinary
    if (variation.image) {
      await deleteFromCloudinary(variation.image);
    }

    // Hard delete variation
    await ProductVariation.findByIdAndDelete(variationId);

    // Update product stock from variations
    const product = await Product.findById(variation.product_id);
    if (product) {
      await product.updateStockFromVariations();
    }

    return {
      success: true,
      message: "Product variation permanently deleted",
    };
  } catch (error) {
    throw error;
  }
};

// Get variation statistics
const getVariationStats = async (productId) => {
  try {
    if (productId) {
      // Get stats for specific product
      const [
        totalVariations,
        activeVariations,
        inactiveVariations,
        lowStockVariations,
      ] = await Promise.all([
        ProductVariation.countDocuments({
          product_id: productId,
          isDeleted: false,
        }),
        ProductVariation.countDocuments({
          product_id: productId,
          status: "active",
          isDeleted: false,
        }),
        ProductVariation.countDocuments({
          product_id: productId,
          status: "inactive",
          isDeleted: false,
        }),
        ProductVariation.countDocuments({
          product_id: productId,
          stock: { $lt: 10 },
          isDeleted: false,
        }),
      ]);

      return {
        success: true,
        data: {
          total: totalVariations,
          active: activeVariations,
          inactive: inactiveVariations,
          lowStock: lowStockVariations,
        },
      };
    } else {
      // Get global stats
      const [
        totalVariations,
        activeVariations,
        inactiveVariations,
        lowStockVariations,
      ] = await Promise.all([
        ProductVariation.countDocuments({ isDeleted: false }),
        ProductVariation.countDocuments({ status: "active", isDeleted: false }),
        ProductVariation.countDocuments({
          status: "inactive",
          isDeleted: false,
        }),
        ProductVariation.countDocuments({
          stock: { $lt: 10 },
          isDeleted: false,
        }),
      ]);

      return {
        success: true,
        data: {
          total: totalVariations,
          active: activeVariations,
          inactive: inactiveVariations,
          lowStock: lowStockVariations,
        },
      };
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createProductVariation,
  getProductVariations,
  getVariationById,
  updateProductVariation,
  softDeleteProductVariation,
  hardDeleteProductVariation,
  getVariationStats,
};
