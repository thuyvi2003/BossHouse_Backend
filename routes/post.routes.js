const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const protectRoute = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../public/uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch { }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname || '');
    cb(null, unique);
  }
});
const upload = multer({ storage });


// // ==================== ADMIN ROUTES ====================
// router.post('/', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.createPost);
// router.put('/:id', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.updatePost);
// router.delete('/:id', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.deletePost);
// router.delete('/:id/permanent', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.permanentDeletePost);
// router.patch('/:id/status', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.changePostStatus);
// router.patch('/:id/featured', authMiddleware.protectRoute, authMiddleware.requireRoles(['admin']), postController.setFeaturedPost);

// ==================== ADMIN ROUTES ====================
router.post('/', protectRoute(['admin']), postController.createPost);
router.put('/:id', protectRoute(['admin']), postController.updatePost);
router.delete('/:id', protectRoute(['admin']), postController.deletePost);
router.delete('/:id/permanent', protectRoute(['admin']), postController.permanentDeletePost);
router.patch('/:id/status', protectRoute(['admin']), postController.changePostStatus);
router.patch('/:id/featured', protectRoute(['admin']), postController.setFeaturedPost);


// ==================== PUBLIC ROUTES ====================
router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/filter', postController.filterPosts);
router.get('/admin/filter', protectRoute(['admin']), postController.filterPosts);
router.get('/:id', postController.getPostById);

// ==================== UPLOAD (LOCAL DISK) ====================
router.post('/upload', protectRoute(['admin']), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  const publicUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ status: 'success', url: publicUrl, filename: req.file.filename });
});

module.exports = router;
