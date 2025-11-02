const mongoose = require("mongoose");
const User = require("../models/user.model.js");
const bcrypt = require("bcryptjs");

const Veterinarian = require("../models/veterinarian.model.js");
const { uploadToCloudinary, deleteFromCloudinary } = require("./cloudinary.services.js");

const changePasswordService = async (userId, currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required!");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match!");
    }

    if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long!");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found!");
    }

    if (!user.password) {
        throw new Error("This account uses Google login. Password change is not available.");
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
        throw new Error("Current password is incorrect!");
    }

    user.password = newPassword;
    await user.save();

    return { success: true, message: "Password changed successfully!" };
};

const deleteAccountService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found!");
    }

    if (user.is_deleted) {
        throw new Error("Account is already deleted!");
    }

    user.is_deleted = true;
    await user.save();

    return { success: true, message: "Account has been deleted!" };
};

const getLoginHistoryService = async (userId, page = 1, limit = 10) => {
    const user = await User.findById(userId).select("login_history");
    if (!user) {
        throw new Error("User not found!");
    }

    const totalItems = user.login_history.length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    // Sort by login_time in descending order (newest first)
    const loginHistory = user.login_history
        .sort((a, b) => b.login_time - a.login_time)
        .slice(skip, skip + limit)
        .map((entry, index) => ({
            id: `${userId}-${skip + index}`, // Unique ID for frontend
            loginTime: entry.login_time,
            loginType: entry.login_type,
        }));

    return {
        loginHistory,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
        },
    };
};

const getProfileService = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format!");
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw new Error("User not found!");
    }

    if (user.is_deleted) {
        throw new Error("This account has been deleted!");
    }

    let veterinarian = null;
    if (user.role === "veterinarian") {
        veterinarian = await Veterinarian.findOne({ user_id: userId });
        console.log("Veterinarian query for userId:", userId, "Result:", veterinarian); // Debug log
    }

    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profile_image: user.profile_image,
            role: user.role,
            created_at: user.created_at,
        },
        veterinarian: veterinarian
            ? {
                specialty: veterinarian.specialty,
                years_experience: veterinarian.years_experience,
                bio: veterinarian.bio,
            }
            : null,
    };
};

const updateProfileService = async (userId, role, profileData) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format!");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found!");
    }

    if (user.is_deleted) {
        throw new Error("This account has been deleted!");
    }

    // Update name for all roles
    if (profileData.name) {
        if (typeof profileData.name !== "string" || profileData.name.length < 3) {
            throw new Error("Name must be a string with at least 3 characters!");
        }
        user.name = profileData.name;
    }

    // Update veterinarian-specific fields
    let veterinarian = null;
    if (role === "veterinarian") {
        veterinarian = await Veterinarian.findOne({ user_id: userId });
        console.log("Existing veterinarian for userId:", userId, "Result:", veterinarian); // Debug log
        if (!veterinarian) {
            veterinarian = new Veterinarian({ user_id: userId });
            console.log("Created new veterinarian for userId:", userId); // Debug log
        }

        if (profileData.specialty !== undefined) {
            if (typeof profileData.specialty !== "string") {
                throw new Error("Specialty must be a string!");
            }
            veterinarian.specialty = profileData.specialty;
        }

        if (profileData.years_experience !== undefined) {
            if (!Number.isInteger(Number(profileData.years_experience)) || Number(profileData.years_experience) <= 0) {
                throw new Error("Years of experience must be a positive integer!");
            }
            veterinarian.years_experience = Number(profileData.years_experience);
        }

        if (profileData.bio !== undefined) {
            if (typeof profileData.bio !== "string") {
                throw new Error("Bio must be a string!");
            }
            veterinarian.bio = profileData.bio;
        }

        await veterinarian.save();
        console.log("Saved veterinarian:", veterinarian); // Debug log
    }

    await user.save();

    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            profile_image: user.profile_image,
            role: user.role,
            created_at: user.created_at,
        },
        veterinarian: veterinarian
            ? {
                specialty: veterinarian.specialty,
                years_experience: veterinarian.years_experience,
                bio: veterinarian.bio,
            }
            : null,
    };
};

const uploadAvatarService = async (userId, image) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found!");
    }

    if (user.is_deleted) {
        throw new Error("This account has been deleted!");
    }

    // Delete existing profile image from Cloudinary if it exists
    if (user.profile_image && user.profile_image.includes("cloudinary.com")) {
        await deleteFromCloudinary(user.profile_image);
    }

    // Upload new image to Cloudinary
    const secureUrl = await uploadToCloudinary(image, "profile_images");
    user.profile_image = secureUrl;

    await user.save();

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image,
        role: user.role,
        created_at: user.created_at,
    };
};

module.exports = {
    changePasswordService,
    deleteAccountService,
    getLoginHistoryService,
    getProfileService,
    updateProfileService,
    uploadAvatarService
};