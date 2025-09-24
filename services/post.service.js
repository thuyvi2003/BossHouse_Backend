//Vo Lam Thuy Vi
const Post = require('../models/post.model');

// Tạo bài viết mới
exports.createPost = async (postData) => {
    try {
        const post = await Post.create(postData);
        if (!post) {
            throw new Error('Failed to create post');
        }
        return post;
    } catch (error) {
        throw new Error(`Error creating post: ${error.message}`);
    }
};

exports.getAllPosts = async (filters = {}, role = 'user') => {
    try {
        const query = {};

        if (role === 'admin') {
            // Admin có thể filter tất cả
            if (filters.status) query.status = filters.status;
            if (filters.category) query.category = filters.category;
            if (filters.created_by) query.created_by = filters.created_by;
            if (filters.is_featured !== undefined) query.is_featured = filters.is_featured;
        } else {
            // User chỉ được thấy ACTIVE
            query.status = 'ACTIVE';
            if (filters.category) query.category = filters.category;
            if (filters.tags && filters.tags.length > 0) {
                query.tags = { $in: filters.tags };
            }
            if (filters.is_featured !== undefined) query.is_featured = filters.is_featured;
        }

        const limit = filters.limit || (role === 'admin' ? 50 : 20);
        const skip = filters.skip || 0;

        const posts = await Post.find(query)
            .sort(role === 'admin'
                ? { created_at: -1 }
                : { is_featured: -1, priority: -1, created_at: -1 }
            )
            .limit(limit)
            .skip(skip);

        const total = await Post.countDocuments(query);

        return {
            posts,
            total,
            page: Math.floor(skip / limit) + 1,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        throw new Error(`Error getting posts: ${error.message}`);
    }
};

// Lấy tất cả bài viết cho user (chỉ hiển thị ACTIVE)
exports.getAllPostsUser = async (filters = {}) => {
    try {
        const query = { status: 'ACTIVE' };
        
        // Filter theo category
        if (filters.category) {
            query.category = filters.category;
        }
        
        // Filter theo tags
        if (filters.tags && filters.tags.length > 0) {
            query.tags = { $in: filters.tags };
        }
        
        // Filter theo featured
        if (filters.is_featured !== undefined) {
            query.is_featured = filters.is_featured;
        }

        const posts = await Post.find(query)
            .sort({ is_featured: -1, priority: -1, created_at: -1 })
            .limit(filters.limit || 20)
            .skip(filters.skip || 0);
            
        const total = await Post.countDocuments(query);
        
        return {
            posts,
            total,
            page: Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1,
            totalPages: Math.ceil(total / (filters.limit || 20))
        };
    } catch (error) {
        throw new Error(`Error getting posts for user: ${error.message}`);
    }
};

// Lấy bài viết theo ID
exports.getPostById = async (postId) => {
    try {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }
        return post;
    } catch (error) {
        throw new Error(`Error getting post: ${error.message}`);
    }
};

// Cập nhật bài viết
exports.updatePost = async (postId, updateData) => {
    try {
        const post = await Post.findByIdAndUpdate(
            postId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        return post;
    } catch (error) {
        throw new Error(`Error updating post: ${error.message}`);
    }
};

// Xóa bài viết (soft delete)
exports.deletePost = async (postId) => {
    try {
        const post = await Post.findByIdAndUpdate(
            postId,
            { status: 'INACTIVE' },
            { new: true }
        );
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        return post;
    } catch (error) {
        throw new Error(`Error deleting post: ${error.message}`);
    }
};

// Xóa vĩnh viễn bài viết
exports.permanentDeletePost = async (postId) => {
    try {
        const post = await Post.findByIdAndDelete(postId);
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        return post;
    } catch (error) {
        throw new Error(`Error permanently deleting post: ${error.message}`);
    }
};

// Tăng view count
exports.incrementView = async (postId) => {
    try {
        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { view_count: 1 } },
            { new: true }
        );
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        return post;
    } catch (error) {
        throw new Error(`Error incrementing view: ${error.message}`);
    }
};

// Lấy bài viết nổi bật
exports.getFeaturedPosts = async (limit = 5) => {
    try {
        const posts = await Post.find({ 
            status: 'ACTIVE', 
            is_featured: true 
        })
        .sort({ priority: -1, created_at: -1 })
        .limit(limit);
        
        return posts;
    } catch (error) {
        throw new Error(`Error getting featured posts: ${error.message}`);
    }
};

// Lấy bài viết theo category
exports.getPostsByCategory = async (category, limit = 10) => {
    try {
        const posts = await Post.find({ 
            status: 'ACTIVE', 
            category: category 
        })
        .sort({ created_at: -1 })
        .limit(limit);
        
        return posts;
    } catch (error) {
        throw new Error(`Error getting posts by category: ${error.message}`);
    }
};

// Tìm kiếm bài viết
exports.searchPosts = async (searchTerm, filters = {}) => {
    try {
        const query = {
            status: 'ACTIVE',
            $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { tags: { $in: [new RegExp(searchTerm, 'i')] } }
            ]
        };
        
        // Thêm filters nếu có
        if (filters.category) {
            query.category = filters.category;
        }
        
        if (filters.created_by) {
            query.created_by = filters.created_by;
        }

        const posts = await Post.find(query)
            .sort({ created_at: -1 })
            .limit(filters.limit || 20)
            .skip(filters.skip || 0);
            
        const total = await Post.countDocuments(query);
        
        return {
            posts,
            total,
            searchTerm,
            page: Math.floor((filters.skip || 0) / (filters.limit || 20)) + 1,
            totalPages: Math.ceil(total / (filters.limit || 20))
        };
    } catch (error) {
        throw new Error(`Error searching posts: ${error.message}`);
    }
};

// Xóa vĩnh viễn bài viết
exports.permanentDeletePost = async (postId) => {
    try {
        const post = await Post.findByIdAndDelete(postId);
        
        if (!post) {
            throw new Error('Post not found');
        }
        
        return post;
    } catch (error) {
        throw new Error(`Error permanently deleting post: ${error.message}`);
    }
};