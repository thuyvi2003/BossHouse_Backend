const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const protectRoute = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const { uploadToCloudinary } = require('../services/cloudinary.services');

// Admin routes
router.post('/', protectRoute(['admin']), eventController.createEvent);
router.put('/:id', protectRoute(['admin']), eventController.updateEvent);
router.delete('/:id', protectRoute(['admin']), eventController.deleteEvent);
router.delete('/:id/permanent', protectRoute(['admin']), eventController.permanentDeleteEvent);

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/search', eventController.searchEvents);
router.get('/filter', eventController.filterEvents);
router.get('/admin/filter', protectRoute(['admin']), eventController.filterEvents);
router.get('/:id', protectRoute(), eventController.getEventById);

// User routes
router.post('/:id/register', protectRoute(), eventController.registerForEvent);
router.post('/:id/cancel', protectRoute(), eventController.cancelRegistration);
router.get('/my/registrations', protectRoute(), eventController.getMyRegistrations);

// Upload route
router.post('/upload', protectRoute(['admin']), uploadSingle('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const imageUrl = await uploadToCloudinary(req.file, 'events');
    
    res.status(201).json({
      status: 'success',
      url: imageUrl,
      filename: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to upload image',
    });
  }
});

module.exports = router;
