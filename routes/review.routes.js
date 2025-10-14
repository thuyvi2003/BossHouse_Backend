const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const reviewController = require('../controllers/review.controller');

// =============================================================================
// PUBLIC ROUTES - Tất cả role (Admin/Staff/Veterinarian/User/Guest)
// =============================================================================

// 67. View review list - Admin, Staff, Veterinarian, User, Guest
router.get('/', reviewController.listReviews);

// Protected list for dashboard (ensures role is read from token)
router.get('/manage', protectRoute(["admin","staff","veterinarian"]), reviewController.listReviews);

// 71. Search review - Admin, Staff, Veterinarian, User, Guest  
router.get('/search', reviewController.searchReviews);

// Protected search for dashboard
router.get('/manage/search', protectRoute(["admin","staff","veterinarian"]), reviewController.searchReviews);

// 68. View review detail - Admin, Staff, Veterinarian, User, Guest
router.get('/:id', reviewController.getReview);

// 72. Filter review - Admin, Staff, Veterinarian, User, Guest
// (Filter được tích hợp trong GET / - listReviews)

// =============================================================================
// AUTHENTICATED ROUTES
// =============================================================================

// 66. Create product reviews - Admin, Staff, Veterinarian, User
router.post('/', protectRoute(["user","staff","veterinarian","admin"]), reviewController.createReview);

// 69. Edit review - Admin, Staff, Veterinarian, User (theo bảng ảnh)
router.put('/:id', protectRoute(["user","staff","veterinarian","admin"]), reviewController.updateReview);

// 70. Delete review - Admin, Staff, Veterinarian, User
router.delete('/:id', protectRoute(["user","staff","veterinarian","admin"]), reviewController.deleteOrHideReview);

// Reply to Review - User/Staff/Veterinarian/Admin can reply
router.post('/:id/replies', protectRoute(["user","staff","veterinarian","admin"]), reviewController.createReply);

// View replies - All roles (public)
router.get('/:id/replies', reviewController.listReplies);

module.exports = router;


