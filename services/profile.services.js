const User = require("../models/user.model.js");
const bcrypt = require("bcryptjs");

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

module.exports = { changePasswordService, deleteAccountService, getLoginHistoryService };