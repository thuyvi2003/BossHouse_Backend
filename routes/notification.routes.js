const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const notificationController = require('../controllers/notification.controller');

// =============================================================================
// AUTHENTICATED ROUTES - Admin/Staff/Veterinarian/User
// =============================================================================

// 81. View notification list - Admin/Staff/Veterinarian/User
router.get('/', protectRoute(['admin', 'staff', 'veterinarian', 'user']), notificationController.listNotifications);

// 85. Search notification - Admin/Staff/Veterinarian/User
router.get('/search', protectRoute(['admin', 'staff', 'veterinarian', 'user']), notificationController.searchNotifications);

// 86. Filter notification - Admin/Staff/Veterinarian/User
// (Filter được tích hợp trong GET / - listNotifications)

// 82. View notification detail - Admin/Staff/Veterinarian/User
router.get('/:id', protectRoute(['admin', 'staff', 'veterinarian', 'user']), notificationController.getNotification);

// =============================================================================
// ADMIN ONLY ROUTES
// =============================================================================

// 80. Create notification - Admin only
router.post('/', protectRoute(['admin']), notificationController.createNotification);

// 83. Edit notification - Admin only
router.put('/:id', protectRoute(['admin']), notificationController.updateNotification);

// 84. Delete notification - Admin only
router.delete('/:id', protectRoute(['admin']), notificationController.deleteNotification);

// Additional admin routes
router.post('/:id/send', protectRoute(['admin']), notificationController.sendNotification);
router.post('/:id/schedule', protectRoute(['admin']), notificationController.scheduleNotification);
router.get('/stats/overview', protectRoute(['admin']), notificationController.getNotificationStats);

module.exports = router;
