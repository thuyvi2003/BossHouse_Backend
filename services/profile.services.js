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

module.exports = { changePasswordService, deleteAccountService };