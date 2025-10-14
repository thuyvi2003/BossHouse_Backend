const postService = require('../services/post.service');

// Tạo bài viết mới
exports.createPost = async (req, res, next) => {
    try {
        const postData = {
            ...req.body,
            created_by: req.user ? req.user.name || req.user.email : 'Anonymous'
        };
        
        const post = await postService.createPost(postData);
        
        res.status(201).json({
            status: 'success',
            message: 'Post created successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Lấy tất cả bài viết (chung cho tất cả role)
exports.getAllPosts = async (req, res, next) => {
    try {
        const filters = {
            category: req.query.category,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            is_featured: req.query.is_featured === 'true' ? true : req.query.is_featured === 'false' ? false : undefined,
            limit: parseInt(req.query.limit) || 20,
            skip: parseInt(req.query.skip) || 0
        };
        
        const result = await postService.getAllPosts(filters);
        
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Lọc bài viết
exports.filterPosts = async (req, res, next) => {
    try {
        const filters = {
            category: req.query.category,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            is_featured: req.query.is_featured === 'true' ? true : req.query.is_featured === 'false' ? false : undefined,
            status: req.query.status,
            created_by: req.query.created_by,
            limit: parseInt(req.query.limit) || 20,
            skip: parseInt(req.query.skip) || 0
        };
        
        // Check if user is admin to determine role
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'Admin');
        const role = isAdmin ? 'admin' : 'user';
        
        console.log('filterPosts - User:', req.user);
        console.log('filterPosts - IsAdmin:', isAdmin);
        console.log('filterPosts - Role:', role);
        console.log('filterPosts - Filters:', filters);
        
        const result = await postService.getAllPosts(filters, role);
        
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Lấy bài viết theo ID
exports.getPostById = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Tăng view count khi user xem
        await postService.incrementView(id);
        const post = await postService.getPostById(id);
        
        res.status(200).json({
            status: 'success',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Cập nhật bài viết
exports.updatePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const post = await postService.updatePost(id, updateData);
        
        res.status(200).json({
            status: 'success',
            message: 'Post updated successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Xóa bài viết (soft delete)
exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const post = await postService.deletePost(id);
        
        res.status(200).json({
            status: 'success',
            message: 'Post deleted successfully',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Xóa vĩnh viễn bài viết
exports.permanentDeletePost = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const post = await postService.permanentDeletePost(id);
        
        res.status(200).json({
            status: 'success',
            message: 'Post permanently deleted',
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Lấy bài viết nổi bật
exports.getFeaturedPosts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        
        const posts = await postService.getFeaturedPosts(limit);
        
        res.status(200).json({
            status: 'success',
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

// Lấy bài viết theo category
exports.getPostsByCategory = async (req, res, next) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const posts = await postService.getPostsByCategory(category, limit);
        
        res.status(200).json({
            status: 'success',
            data: posts
        });
    } catch (error) {
        next(error);
    }
};

// Tìm kiếm bài viết
exports.searchPosts = async (req, res, next) => {
    try {
        const { q: searchTerm } = req.query;
        
        if (!searchTerm) {
            return res.status(400).json({
                status: 'error',
                message: 'Search term is required'
            });
        }
        
        const filters = {
            category: req.query.category,
            created_by: req.query.created_by,
            limit: parseInt(req.query.limit) || 20,
            skip: parseInt(req.query.skip) || 0
        };
        
        const result = await postService.searchPosts(searchTerm, filters);
        
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Thay đổi trạng thái bài viết
exports.changePostStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['ACTIVE', 'INACTIVE', 'DRAFT'].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid status. Must be ACTIVE, INACTIVE, or DRAFT'
            });
        }
        
        const post = await postService.updatePost(id, { status });
        
        res.status(200).json({
            status: 'success',
            message: `Post status changed to ${status}`,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// Đặt bài viết làm nổi bật
exports.setFeaturedPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_featured, priority } = req.body;
        
        const updateData = {
            is_featured: is_featured,
            priority: priority || 0
        };
        
        const post = await postService.updatePost(id, updateData);
        
        res.status(200).json({
            status: 'success',
            message: `Post ${is_featured ? 'set as featured' : 'removed from featured'}`,
            data: post
        });
    } catch (error) {
        next(error);
    }
};

// // Lấy thống kê bài viết (Admin)
// exports.getPostStats = async (req, res, next) => {
//     try {
//         const Post = require('../models/post.model');
        
//         const stats = await Post.aggregate([
//             {
//                 $group: {
//                     _id: '$status',
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);
        
//         const totalViews = await Post.aggregate([
//             {
//                 $group: {
//                     _id: null,
//                     totalViews: { $sum: '$view_count' }
//                 }
//             }
//         ]);
        
//         const featuredCount = await Post.countDocuments({ is_featured: true, status: 'ACTIVE' });
        
//         res.status(200).json({
//             status: 'success',
//             data: {
//                 statusStats: stats,
//                 totalViews: totalViews[0]?.totalViews || 0,
//                 featuredCount
//             }
//         });
//     } catch (error) {
//         next(error);
//     }
// };
