const User = require("../models/user.model.js");
const Veterinarian = require("../models/veterinarian.model.js");
const mongoose = require("mongoose");

const getAccountsService = async (query = {}) => {
    const { search, role, status, page = 1, limit = 8 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter - REMOVED: is_deleted: false to include soft-deleted
    const filter = {};

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }

    if (role && role !== "all") {
        filter.role = role;
    }

    if (status && status !== "all") {
        if (status === "active") {
            filter.is_banned = false;
            filter.is_deleted = false;
        } else if (status === "banned") {
            filter.is_banned = true;
            filter.is_deleted = false;
        } else if (status === "inactive") {  // NEW: Filter for soft-deleted
            filter.is_deleted = true;
        }
    }

    // Fetch paginated accounts - UPDATED: Select includes is_deleted
    const accounts = await User.find(filter)
        .select("name email role is_banned is_deleted created_at")  // ADDED: is_deleted
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Map to frontend format - UPDATED: Status logic includes inactive
    const formattedAccounts = accounts.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.is_deleted ? "inactive" : (user.is_banned ? "banned" : "active"),  // NEW: inactive for deleted
        is_deleted: user.is_deleted,  // NEW: Expose for frontend disabling/tooltips
        createdAt: user.created_at,
    }));

    // Get total count for pagination
    const totalItems = await User.countDocuments(filter);

    return {
        accounts: formattedAccounts,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalItems / parseInt(limit)),
            totalItems,
            itemsPerPage: parseInt(limit),
        },
    };
};

const getAccountDetailService = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format!");
    }

    const user = await User.findOne({ _id: userId })  // REMOVED: is_deleted: false to include deleted
        .select("name email role is_banned is_deleted created_at")  // NEW: Added is_deleted to select
        .lean();

    if (!user) {
        throw new Error("Account not found!");
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.is_deleted ? "inactive" : (user.is_banned ? "banned" : "active"),  // FIXED: Prioritize is_deleted like in list
        is_deleted: user.is_deleted,  // NEW: Expose flag (for potential frontend use, e.g., gray out fields)
        createdAt: user.created_at,
    };
};

const updateRoleService = async (userId, newRole) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format!");
    }

    const validRoles = ["user", "admin", "staff", "veterinarian"];
    if (!validRoles.includes(newRole)) {
        throw new Error("Invalid role!");
    }

    // FIXED: Sequential updates (no transaction for standalone MongoDB)
    try {
        // Step 1: Update user role (atomic on its own)
        const user = await User.findOneAndUpdate(
            { _id: userId, is_deleted: false },
            { role: newRole },
            { new: true }
        ).select("name email role is_banned created_at");

        if (!user) {
            throw new Error("Account not found!");
        }

        // Step 2: If changing TO "veterinarian", create default doc if none exists
        if (newRole === "veterinarian") {
            const existingVet = await Veterinarian.findOne({ user_id: userId });
            if (!existingVet) {
                const newVet = new Veterinarian({
                    user_id: userId,
                    specialty: "",  // Default empty
                    years_experience: 0,  // Default 0
                    bio: "",  // Default empty
                    is_active: true,  // Default active
                });
                await newVet.save();  // Non-critical; fails gracefully if issues
            }
        }

        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.is_banned ? "banned" : "active",
            createdAt: user.created_at,
        };
    } catch (error) {
        console.error("Error in updateRoleService:", error);
        throw error;  // Re-throw for controller handling
    }
};

const updateBanStatusService = async (userId, banStatus) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format!");
    }

    const isBanned = banStatus === "banned";
    const user = await User.findOneAndUpdate(
        { _id: userId, is_deleted: false },
        { is_banned: isBanned },
        { new: true }
    ).select("name email role is_banned created_at");

    if (!user) {
        throw new Error("Account not found!");
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.is_banned ? "banned" : "active",
        createdAt: user.created_at,
    };
};

module.exports = {
    getAccountsService,
    getAccountDetailService,
    updateRoleService,
    updateBanStatusService,
};