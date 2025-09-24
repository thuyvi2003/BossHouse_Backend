const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middleware/auth.middleware');

// // ==================== ADMIN ROUTES ====================
// router.post('/', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.createPost);
// router.put('/:id', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.updatePost);
// router.delete('/:id', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.deletePost);
// router.delete('/:id/permanent', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.permanentDeletePost);
// router.patch('/:id/status', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.changePostStatus);
// router.patch('/:id/featured', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.setFeaturedPost);

// ==================== ADMIN ROUTES ====================
router.post('/',  postController.createPost);
router.put('/:id',  postController.updatePost);
router.delete('/:id',  postController.deletePost);
router.delete('/:id/permanent', postController.permanentDeletePost);
router.patch('/:id/status', postController.changePostStatus);
router.patch('/:id/featured', postController.setFeaturedPost);


// ==================== PUBLIC ROUTES ====================
router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/filter', postController.filterPosts);
router.get('/:id', postController.getPostById);

module.exports = router;
