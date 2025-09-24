const Category = require("../models/category.model.js");

// Create a new category
const createCategory = async (categoryData) => {
    try {
        const { name, description, status, image, createdBy } = categoryData;
        
        // Check if category name already exists
        const existingCategory = await Category.findByName(name);
        if (existingCategory) {
            throw new Error("Category name already exists");
        }

        const newCategory = new Category({
            name,
            description: description || "",
            status: status || "active",
            image: image || "",
            createdBy
        });

        const savedCategory = await newCategory.save();
        return {
            success: true,
            data: savedCategory,
            message: "Category created successfully"
        };
    } catch (error) {
        throw error;
    }
};

// Get all categories with pagination, search, and filtering
const getAllCategories = async (queryParams) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = "",
            status = "",
            sortBy = "created_at",
            sortOrder = "desc"
        } = queryParams;

        // Build filter object
        const filter = { isDeleted: false };

        // Add search filter
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        // Add status filter
        if (status && ["active", "inactive"].includes(status)) {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Execute queries
        const [categories, totalItems] = await Promise.all([
            Category.find(filter)
                .populate('createdBy', 'name email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Category.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalItems / parseInt(limit));

        return {
            success: true,
            data: categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                totalItems
            }
        };
    } catch (error) {
        throw error;
    }
};

// Get category by ID
const getCategoryById = async (categoryId) => {
    try {
        const category = await Category.findOne({
            _id: categoryId,
            isDeleted: false
        }).populate('createdBy', 'name email');

        if (!category) {
            throw new Error("Category not found");
        }

        return {
            success: true,
            data: category
        };
    } catch (error) {
        throw error;
    }
};

// Update category
const updateCategory = async (categoryId, updateData) => {
    try {
        const { name, description, status, image } = updateData;

        // Check if category exists
        const existingCategory = await Category.findOne({
            _id: categoryId,
            isDeleted: false
        });

        if (!existingCategory) {
            throw new Error("Category not found");
        }

        // Check for duplicate name if name is being updated
        if (name && name !== existingCategory.name) {
            const duplicateCategory = await Category.findByName(name);
            if (duplicateCategory) {
                throw new Error("Category name already exists");
            }
        }

        // Build update object
        const updateObject = {};
        if (name !== undefined) updateObject.name = name;
        if (description !== undefined) updateObject.description = description;
        if (status !== undefined) updateObject.status = status;
        if (image !== undefined) updateObject.image = image;

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            updateObject,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        return {
            success: true,
            data: updatedCategory,
            message: "Category updated successfully"
        };
    } catch (error) {
        throw error;
    }
};

// Soft delete category
const softDeleteCategory = async (categoryId) => {
    try {
        const category = await Category.findOne({
            _id: categoryId,
            isDeleted: false
        });

        if (!category) {
            throw new Error("Category not found");
        }

        const deletedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { isDeleted: true },
            { new: true }
        );

        return {
            success: true,
            message: "Category deleted successfully"
        };
    } catch (error) {
        throw error;
    }
};

// Hard delete category (completely remove from database)
const hardDeleteCategory = async (categoryId) => {
    try {
        const category = await Category.findOne({
            _id: categoryId,
            isDeleted: false
        });

        if (!category) {
            throw new Error("Category not found");
        }

        await Category.findByIdAndDelete(categoryId);

        return {
            success: true,
            message: "Category permanently deleted"
        };
    } catch (error) {
        throw error;
    }
};

// Search categories by name
const searchCategories = async (searchTerm, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = "",
            sortBy = "created_at",
            sortOrder = "desc"
        } = options;

        const filter = {
            isDeleted: false,
            name: { $regex: searchTerm, $options: "i" }
        };

        if (status && ["active", "inactive"].includes(status)) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        const [categories, totalItems] = await Promise.all([
            Category.find(filter)
                .populate('createdBy', 'name email')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit)),
            Category.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalItems / parseInt(limit));

        return {
            success: true,
            data: categories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages,
                totalItems
            }
        };
    } catch (error) {
        throw error;
    }
};

// Get category statistics
const getCategoryStats = async () => {
    try {
        const [totalCategories, activeCategories, inactiveCategories] = await Promise.all([
            Category.countDocuments({ isDeleted: false }),
            Category.countDocuments({ status: "active", isDeleted: false }),
            Category.countDocuments({ status: "inactive", isDeleted: false })
        ]);

        return {
            success: true,
            data: {
                total: totalCategories,
                active: activeCategories,
                inactive: inactiveCategories
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    softDeleteCategory,
    hardDeleteCategory,
    searchCategories,
    getCategoryStats
};
