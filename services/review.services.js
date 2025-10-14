const Review = require('../models/review.model');
const ReviewReply = require('../models/reviewReply.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Service = require('../models/service.model');
const { uploadMultipleToCloudinary } = require('./cloudinary.services');

/**
 * 1. Create Review - Thu thập phản hồi thực tế từ người dùng
 */
exports.createReview = async (reviewData, userId, userRole) => {
    try {
        // Validate target exists
        const { target_type, target_id } = reviewData;
        let targetExists = false;
        
        if (target_type === 'product') {
            const product = await Product.findById(target_id);
            targetExists = !!product;
        } else if (target_type === 'service') {
            const service = await Service.findById(target_id);
            targetExists = !!service;
        }
        
        if (!targetExists) {
            throw new Error(`${target_type} not found`);
        }

        // Order validation: if Order model exists, require a successful order for this user+target
        // If Order model is missing (feature not yet implemented) keep default behavior (allow reviews)
        let orderSuccessful = true;
        let foundOrderId = null;

        try {
            // load Order model only if present
            const Order = require('../models/order.model');

            // when Order model exists, be strict by default
            orderSuccessful = false;
            const SUCCESS_ORDER_STATUSES = ['delivered', 'completed', 'finished']; // adjust to your enum

            const order = await Order.findOne({
                user_id: userId,
                target_type,
                target_id,
                status: { $in: SUCCESS_ORDER_STATUSES }
            });

            if (order) {
                orderSuccessful = true;
                foundOrderId = order._id;
            }
        } catch (e) {
            // Order model not present → development mode: allow review creation
            orderSuccessful = true;
        }

        // Admin bypass
        if (userRole === 'admin') {
            orderSuccessful = true;
        }

        // Check if user already reviewed this target
        const existingReview = await Review.findOne({
            user_id: userId,
            target_type,
            target_id,
            status: { $ne: 'deleted' }
        });

        if (existingReview) {
            throw new Error('You have already reviewed this item');
        }

        // Handle images upload (base64 strings or URLs)
        let uploadedImageUrls = [];
        if (Array.isArray(reviewData.images) && reviewData.images.length > 0) {
            try {
                uploadedImageUrls = await uploadMultipleToCloudinary(
                    reviewData.images,
                    'reviews'
                );
            } catch (e) {
                // Continue without blocking review creation
                uploadedImageUrls = [];
            }
        }

        const review = new Review({
            ...reviewData,
            images: uploadedImageUrls,
            user_id: userId,
            created_by_role: userRole,
            status: orderSuccessful ? 'visible' : 'hidden',
            order_id: foundOrderId,
            order_successful: orderSuccessful
        });

        await review.save();
        
        await review.populate('user_id', 'name email');
        
        return review;
    } catch (error) {
        throw new Error(`Error creating review: ${error.message}`);
    }
};

/**
 * 2. View Review List - Giúp tham khảo tổng quan về ý kiến của cộng đồng
 */
exports.getAllReviews = async (filters = {}, userRole = 'guest') => {
    try {
        const {
            target_type,
            target_id,
            user_id,
            status,
            min_rating,
            max_rating,
            page = 1,
            limit = 10,
            sort = '-created_at'
        } = filters;

        const query = {};

        // Basic filters
        if (target_type) query.target_type = target_type;
        if (target_id) query.target_id = target_id;
        if (user_id) query.user_id = user_id;

        // Rating range filter
        if (min_rating || max_rating) {
            query.rating = {};
            if (min_rating) query.rating.$gte = parseInt(min_rating);
            if (max_rating) query.rating.$lte = parseInt(max_rating);
        }

        // Status filter - Admin can see all, others only visible
        if (userRole === 'admin') {
            if (status) query.status = status;
            // Admin can see all statuses if no filter specified
        } else {
            query.status = 'visible'; // Non-admin only see visible reviews
        }

        const skip = (page - 1) * limit;
        const sortObj = {};
        if (sort.startsWith('-')) {
            sortObj[sort.substring(1)] = -1;
        } else {
            sortObj[sort] = 1;
        }

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'name email')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        return {
            reviews,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error getting reviews: ${error.message}`);
    }
};

/**
 * 3. View Review Detail - Giúp hiểu rõ trải nghiệm và chất lượng sản phẩm/dịch vụ
 */
exports.getReviewById = async (reviewId, userRole = 'guest') => {
    try {
        const query = { _id: reviewId };
        
        // Non-admin users can only see visible reviews
        if (userRole !== 'admin') {
            query.status = 'visible';
        }

        const review = await Review.findOne(query)
            .populate('user_id', 'name email');

        if (!review) {
            throw new Error('Review not found');
        }

        return review;
    } catch (error) {
        throw new Error(`Error getting review: ${error.message}`);
    }
};

/**
 * 4. Edit Review - Cho phép người viết cập nhật trải nghiệm hoặc chỉnh sửa lỗi
 */
exports.updateReview = async (reviewId, updateData, userId, userRole) => {
    try {
        const review = await Review.findById(reviewId);
        
        if (!review) {
            throw new Error('Review not found');
        }

        // Check ownership - owner can edit their review, admin can edit any review
        if (review.user_id.toString() !== userId.toString() && userRole !== 'admin') {
            throw new Error('You can only edit your own reviews');
        }

        // Check if review is still editable (not deleted)
        if (review.status === 'deleted') {
            throw new Error('Cannot edit deleted review');
        }

        // Update allowed fields
        const allowedFields = ['rating', 'title', 'content', 'images'];
        const updateFields = {};
        
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields[field] = updateData[field];
            }
        });

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updateFields,
            { new: true, runValidators: true }
        ).populate('user_id', 'name email');

        return updatedReview;
    } catch (error) {
        throw new Error(`Error updating review: ${error.message}`);
    }
};

/**
 * 5. Delete Review / Ban Review - Giữ cho hệ thống review sạch và minh bạch
 */
exports.deleteOrHideReview = async (reviewId, userId, userRole) => {
    try {
        const review = await Review.findById(reviewId);
        
        if (!review) {
            throw new Error('Review not found');
        }

        let updateData = {};

        if (userRole === 'admin') {
            // Admin toggles visibility: hidden <-> visible
            updateData.status = review.status === 'hidden' ? 'visible' : 'hidden';
        } else {
            // User/Staff/Veterinarian can only delete their own review
            if (review.user_id.toString() !== userId.toString()) {
                throw new Error('You can only delete your own reviews');
            }
            updateData.status = 'deleted';
        }

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            updateData,
            { new: true }
        );

        return updatedReview;
    } catch (error) {
        throw new Error(`Error deleting/hiding review: ${error.message}`);
    }
};

/**
 * 6. Search Review - Giúp tìm nhanh nội dung mong muốn
 */
exports.searchReviews = async (searchQuery, filters = {}, userRole = 'guest') => {
    try {
        const { page = 1, limit = 10 } = filters;
        
        const query = {
            $and: [
                {
                    $or: [
                        { title: { $regex: searchQuery, $options: 'i' } },
                        { content: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ]
        };

        // Status filter based on role
        if (userRole === 'admin') {
            // Admin can search all reviews
        } else {
            query.$and.push({ status: 'visible' });
        }

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Review.countDocuments(query)
        ]);

        return {
            reviews,
            search_query: searchQuery,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error searching reviews: ${error.message}`);
    }
};

/**
 * 8. Reply to Review - Tăng tính tương tác, giải đáp thắc mắc, cải thiện dịch vụ
 */
exports.createReply = async (reviewId, replyData, userId, userRole) => {
    try {
        // Check if review exists and is visible
        const review = await Review.findOne({
            _id: reviewId,
            status: { $in: ['visible', 'hidden'] } // Can reply to visible or hidden reviews
        });

        if (!review) {
            throw new Error('Review not found or deleted');
        }

        const reply = new ReviewReply({
            review_id: reviewId,
            user_id: userId,
            content: replyData.content,
            created_by_role: userRole,
            status: 'visible'
        });

        await reply.save();

        // Update reply count in review
        await Review.findByIdAndUpdate(reviewId, {
            $inc: { replies_count: 1 }
        });

        // Populate user info for response
        await reply.populate('user_id', 'name email');

        return reply;
    } catch (error) {
        throw new Error(`Error creating reply: ${error.message}`);
    }
};

/**
 * Get replies for a review
 */
exports.getReplies = async (reviewId, filters = {}) => {
    try {
        const { page = 1, limit = 10 } = filters;

        // Check if review exists
        const review = await Review.findById(reviewId);
        if (!review) {
            throw new Error('Review not found');
        }

        const query = { 
            review_id: reviewId,
            status: 'visible' // Only show visible replies to public
        };

        const skip = (page - 1) * limit;

        const [replies, total] = await Promise.all([
            ReviewReply.find(query)
                .populate('user_id', 'name email')
                .sort({ created_at: 1 }) // Oldest first for conversation flow
                .skip(skip)
                .limit(parseInt(limit)),
            ReviewReply.countDocuments(query)
        ]);

        return {
            replies,
            review_id: reviewId,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error getting replies: ${error.message}`);
    }
};
