const User = require("../models/user.model.js");
const Veterinarian = require("../models/veterinarian.model.js");
const mongoose = require("mongoose");

const getAccountsService = async (query = {}) => {
    const { search, role, status, page = 1, limit = 8 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {
        is_deleted: false,  // Exclude deleted accounts
    };

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
        } else if (status === "banned") {
            filter.is_banned = true;
        }
    }

    // Fetch paginated accounts
    const accounts = await User.find(filter)
        .select("name email role is_banned created_at")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

    // Map to frontend format
    const formattedAccounts = accounts.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.is_banned ? "banned" : "active",
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

    const user = await User.findOne({ _id: userId, is_deleted: false })
        .select("name email role is_banned created_at")
        .lean();

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