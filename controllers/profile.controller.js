const { changePasswordService, deleteAccountService } = require("../services/profile.services.js");

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id; // From protectRoute middleware
        const data = await changePasswordService(userId, currentPassword, newPassword, confirmPassword);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in change password controller:", error);
        res.status(400).json({ message: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id; // From protectRoute middleware
        const data = await deleteAccountService(userId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in delete account controller:", error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = { changePassword, deleteAccount };