const notificationService = require('../services/notification.services');

/**
 * 80. Create Notification (Tạo thông báo) - Admin only
 */
exports.createNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const notification = await notificationService.createNotification(req.body, userId, userRole);
        
        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 81. View Notification List (Xem danh sách thông báo) - Admin/Staff/Veterinarian/User
 */
exports.listNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const result = await notificationService.getAllNotifications(req.query, userRole, userId);
        
        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 82. View Notification Detail (Xem chi tiết thông báo) - Admin/Staff/Veterinarian/User
 */
exports.getNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const notification = await notificationService.getNotificationById(req.params.id, userRole, userId);
        
        res.status(200).json({
            success: true,
            message: 'Notification retrieved successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 83. Edit Notification (Chỉnh sửa thông báo) - Admin only
 */
exports.updateNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const notification = await notificationService.updateNotification(
            req.params.id, 
            req.body, 
            userId, 
            userRole
        );
        
        res.status(200).json({
            success: true,
            message: 'Notification updated successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 84. Delete Notification (Xóa thông báo) - Admin only
 */
exports.deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const notification = await notificationService.deleteNotification(
            req.params.id, 
            userId, 
            userRole
        );
        
        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 85. Search Notifications (Tìm kiếm thông báo) - Admin/Staff/Veterinarian/User
 */
exports.searchNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        const searchQuery = req.query.q;
        
        const result = await notificationService.searchNotifications(
            searchQuery, 
            req.query, 
            userRole,
            userId
        );
        
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Send Notification (Gửi thông báo) - Admin only
 */
exports.sendNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const notification = await notificationService.sendNotification(
            req.params.id, 
            userId, 
            userRole
        );
        
        res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Schedule Notification (Lên lịch thông báo) - Admin only
 */
exports.scheduleNotification = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        const { scheduled_at } = req.body;
        
        const notification = await notificationService.scheduleNotification(
            req.params.id, 
            scheduled_at,
            userId, 
            userRole
        );
        
        res.status(200).json({
            success: true,
            message: 'Notification scheduled successfully',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Notification Stats (Thống kê thông báo) - Admin only
 */
exports.getNotificationStats = async (req, res, next) => {
    try {
        const userRole = req.user.role.toLowerCase();
        
        const stats = await notificationService.getNotificationStats(userRole);
        
        res.status(200).json({
            success: true,
            message: 'Notification stats retrieved successfully',
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
