const reviewService = require('../services/review.services');

/**
 * 1. Create Review (Tạo review) - User/Staff/Veterinarian/Admin
 */
exports.createReview = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const review = await reviewService.createReview(req.body, userId, userRole);
        
        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 2. View Review List (Xem danh sách review) - All roles
 */
exports.listReviews = async (req, res, next) => {
    try {
        // Determine user role (guest if not authenticated)
        const userRole = req.user ? req.user.role.toLowerCase() : 'guest';
        
        const result = await reviewService.getAllReviews(req.query, userRole);
        
        res.status(200).json({
            success: true,
            message: 'Reviews retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 3. View Review Detail (Xem chi tiết review) - All roles
 */
exports.getReview = async (req, res, next) => {
    try {
        const userRole = req.user ? req.user.role.toLowerCase() : 'guest';
        
        const review = await reviewService.getReviewById(req.params.id, userRole);
        
        res.status(200).json({
            success: true,
            message: 'Review retrieved successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 4. Edit Review (Chỉnh sửa review) - User/Staff/Veterinarian (own review)
 */
exports.updateReview = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const review = await reviewService.updateReview(
            req.params.id, 
            req.body, 
            userId, 
            userRole
        );
        
        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 5. Delete Review / Ban Review (Xóa hoặc Ẩn review)
 * User/Staff/Veterinarian: delete own review
 * Admin: hide/ban any review
 */
exports.deleteOrHideReview = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const review = await reviewService.deleteOrHideReview(
            req.params.id, 
            userId, 
            userRole
        );
        
        const action = userRole === 'admin' ? 'hidden' : 'deleted';
        
        res.status(200).json({
            success: true,
            message: `Review ${action} successfully`,
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 6. Search Review (Tìm kiếm review) - All roles
 */
exports.searchReviews = async (req, res, next) => {
    try {
        const userRole = req.user ? req.user.role.toLowerCase() : 'guest';
        const searchQuery = req.query.q;
        
        const result = await reviewService.searchReviews(
            searchQuery, 
            req.query, 
            userRole
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
 * 8. Reply to Review - Create reply (Phản hồi review)
 * User/Staff/Veterinarian/Admin can reply
 */
exports.createReply = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id;
        const userRole = req.user.role.toLowerCase();
        
        const reply = await reviewService.createReply(
            req.params.id, 
            req.body, 
            userId, 
            userRole
        );
        
        res.status(201).json({
            success: true,
            message: 'Reply created successfully',
            data: reply
        });
    } catch (error) {
        next(error);
    }
};

/**
 * 8. Reply to Review - View replies (Xem phản hồi) - All roles
 */
exports.listReplies = async (req, res, next) => {
    try {
        const result = await reviewService.getReplies(req.params.id, req.query);
        
        res.status(200).json({
            success: true,
            message: 'Replies retrieved successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};


