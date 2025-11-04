const {
    changePasswordService,
    deleteAccountService,
    getLoginHistoryService,
    getProfileService,
    updateProfileService,
    uploadAvatarService,
    linkGoogleService,
    unlinkGoogleService,
} = require("../services/profile.services.js");

const { handleUploadError, uploadSingle } = require("../middleware/upload.middleware.js");


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

const getLoginHistory = async (req, res) => {
    try {
        const userId = req.user._id; // From protectRoute middleware
        const { page = 1, limit = 10 } = req.query;
        const data = await getLoginHistoryService(userId, parseInt(page), parseInt(limit));
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in get login history controller:", error);
        res.status(400).json({ message: error.message });
    }
};

const getProfile = async (req, res, next) => {
    try {
        const profile = await getProfileService(req.user._id);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const profile = await updateProfileService(req.user._id, req.user.role, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

const uploadAvatar = async (req, res, next) => {
    try {
        const user = await uploadAvatarService(req.user._id, req.file);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        handleUploadError(error, req, res, next);
    }
};

const linkGoogle = async (req, res, next) => {
    try {
        const { idToken } = req.body;
        const userId = req.user._id;
        const data = await linkGoogleService(userId, idToken);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in linkGoogle controller:", error);
        res.status(400).json({ message: error.message });
    }
};

const unlinkGoogle = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const data = await unlinkGoogleService(userId);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in unlinkGoogle controller:", error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = { changePassword, deleteAccount, getLoginHistory, getProfile, updateProfile, uploadAvatar, linkGoogle, unlinkGoogle, };