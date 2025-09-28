const Product = require("../models/product.model.js");
const ProductVariation = require("../models/productVariation.model.js");
const Category = require("../models/category.model.js");
const { uploadToCloudinary, deleteFromCloudinary } = require("./cloudinary.services.js");

// Create a new product
const createProduct = async (productData, imageData) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      categoryId,
      status,
      variations,
      createdBy,
    } = productData;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if product name already exists in the same category
    const existingProduct = await Product.findByNameAndCategory(
      name,
      categoryId
    );
    if (existingProduct) {
      throw new Error("Product name already exists in this category");
    }

    // Upload image to Cloudinary if provided
    let imageUrl = "";
    if (imageData) {
      imageUrl = await uploadToCloudinary(imageData, "products");
    }

    const newProduct = new Product({
      name,
      description: description || "",
      price,
      stock: stock || 0,
      categoryId,
      status: status || "active",
      image: imageUrl,
      createdBy,
    });

    const savedProduct = await newProduct.save();

    // Create variations if provided
    if (variations && variations.length > 0) {
      const createdVariations = [];
      for (const variation of variations) {
        const variationData = {
          product_id: savedProduct._id,
          name: variation.name,
          price: variation.price,
          stock: variation.stock,
          attributes: variation.attributes || {},
          createdBy,
        };

        // Upload variation image if provided
        if (variation.image) {
          variationData.image = await uploadToCloudinary(
            variation.image,
            "product-variations"
          );
        }

        const newVariation = new ProductVariation(variationData);
        const savedVariation = await newVariation.save();
        createdVariations.push(savedVariation);
      }

      // Update product stock from variations
      await savedProduct.updateStockFromVariations();
    }

    // Populate the saved product with category and variations
    const populatedProduct = await Product.findById(savedProduct._id)
      .populate("categoryId", "name status")
      .populate("createdBy", "name email");

    return {
      success: true,
      data: populatedProduct,
      message: "Product created successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Get all products with pagination, search, and filtering
const getAllProducts = async (queryParams) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      categoryId = "",
      status = "",
      minPrice = "",
      maxPrice = "",
      minStock = "",
      maxStock = "",
      createdBy = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = queryParams;

    // Build filter object
    const filter = { isDeleted: false };

    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Add category filter
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Add status filter
    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Add stock range filter
    if (minStock || maxStock) {
      filter.stock = {};
      if (minStock) filter.stock.$gte = parseInt(minStock);
      if (maxStock) filter.stock.$lte = parseInt(maxStock);
    }

    // Add createdBy filter
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute queries
    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name status")
        .populate("createdBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    return {
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalItems,
      },
    };
  } catch (error) {
    throw error;
  }
};

// Get product by ID
const getProductById = async (productId) => {
  try {
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    })
      .populate("categoryId", "name status")
      .populate("createdBy", "name email");

    if (!product) {
      throw new Error("Product not found");
    }

    // Get product variations
    const variations = await ProductVariation.findByProductId(productId);

    return {
      success: true,
      data: {
        ...product.toObject(),
        variations,
      },
    };
  } catch (error) {
    throw error;
  }
};

// Update product
const updateProduct = async (productId, updateData, imageData) => {
  try {
    const { name, description, price, stock, categoryId, status, variations } =
      updateData;

    // Check if product exists
    const existingProduct = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // Check for duplicate name if name or category is being updated
    if (name && name !== existingProduct.name) {
      const targetCategoryId = categoryId || existingProduct.categoryId;
      const duplicateProduct = await Product.findByNameAndCategory(
        name,
        targetCategoryId
      );
      if (duplicateProduct) {
        throw new Error("Product name already exists in this category");
      }
    }

    // Check if category exists if categoryId is being updated
    if (categoryId && categoryId !== existingProduct.categoryId.toString()) {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new Error("Category not found");
      }
    }

    // Handle image update
    let imageUrl = existingProduct.image;
    if (imageData && imageData !== existingProduct.image) {
      // Delete old image from Cloudinary if it exists
      if (existingProduct.image) {
        await deleteFromCloudinary(existingProduct.image);
      }
      // Upload new image
      imageUrl = await uploadToCloudinary(imageData, "products");
    }

    // Build update object
    const updateObject = {};
    if (name !== undefined) updateObject.name = name;
    if (description !== undefined) updateObject.description = description;
    if (price !== undefined) updateObject.price = price;
    if (stock !== undefined) updateObject.stock = stock;
    if (categoryId !== undefined) updateObject.categoryId = categoryId;
    if (status !== undefined) updateObject.status = status;
    if (imageData) updateObject.image = imageUrl;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateObject,
      { new: true, runValidators: true }
    )
      .populate("categoryId", "name status")
      .populate("createdBy", "name email");

    // Handle variations update if provided
    if (variations !== undefined) {
      // Delete existing variations
      await ProductVariation.updateMany(
        { product_id: productId },
        { isDeleted: true }
      );

      // Create new variations
      if (variations.length > 0) {
        for (const variation of variations) {
          const variationData = {
            product_id: productId,
            name: variation.name,
            price: variation.price,
            stock: variation.stock,
            attributes: variation.attributes || {},
            createdBy: existingProduct.createdBy,
          };

          // Upload variation image if provided
          if (variation.image) {
            variationData.image = await uploadToCloudinary(
              variation.image,
              "product-variations"
            );
          }

          const newVariation = new ProductVariation(variationData);
          await newVariation.save();
        }
      }

      // Update product stock from variations
      await updatedProduct.updateStockFromVariations();
    }

    return {
      success: true,
      data: updatedProduct,
      message: "Product updated successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Soft delete product
const softDeleteProduct = async (productId) => {
  try {
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Soft delete product
    await Product.findByIdAndUpdate(productId, { isDeleted: true });

    // Soft delete all variations
    await ProductVariation.updateMany(
      { product_id: productId },
      { isDeleted: true }
    );

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    throw error;
  }
};

// Hard delete product
const hardDeleteProduct = async (productId) => {
  try {
    const product = await Product.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Delete images from Cloudinary
    if (product.image) {
      await deleteFromCloudinary(product.image);
    }

    // Get all variations to delete their images
    const variations = await ProductVariation.findByProductId(productId);
    for (const variation of variations) {
      if (variation.image) {
        await deleteFromCloudinary(variation.image);
      }
    }

    // Hard delete variations
    await ProductVariation.deleteMany({ product_id: productId });

    // Hard delete product
    await Product.findByIdAndDelete(productId);

    return {
      success: true,
      message: "Product permanently deleted",
    };
  } catch (error) {
    throw error;
  }
};

// Search products
const searchProducts = async (searchTerm, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId = "",
      status = "",
      minPrice = "",
      maxPrice = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = options;

    const filter = {
      isDeleted: false,
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { tags: { $in: [new RegExp(searchTerm, "i")] } },
      ],
    };

    if (categoryId) filter.categoryId = categoryId;
    if (status && ["active", "inactive"].includes(status))
      filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name status")
        .populate("createdBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / parseInt(limit));

    return {
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalItems,
      },
    };
  } catch (error) {
    throw error;
  }
};

// Get product statistics
const getProductStats = async () => {
  try {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalVariations,
      lowStockProducts,
    ] = await Promise.all([
      Product.countDocuments({ isDeleted: false }),
      Product.countDocuments({ status: "active", isDeleted: false }),
      Product.countDocuments({ status: "inactive", isDeleted: false }),
      ProductVariation.countDocuments({ isDeleted: false }),
      Product.countDocuments({ stock: { $lt: 10 }, isDeleted: false }),
    ]);

    return {
      success: true,
      data: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        variations: totalVariations,
        lowStock: lowStockProducts,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  softDeleteProduct,
  hardDeleteProduct,
  searchProducts,
  getProductStats,
  uploadToCloudinary,
  deleteFromCloudinary,
};
