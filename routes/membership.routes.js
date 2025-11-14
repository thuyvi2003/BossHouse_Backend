const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');
const membershipController = require('../controllers/membership.controller');

// Public routes (authenticated users)
const authRoles = ['admin', 'staff', 'veterinarian', 'user'];
router.get('/', protectRoute(authRoles), membershipController.getAllMemberships);
router.get('/search', protectRoute(authRoles), membershipController.searchMemberships);
router.get('/:id', protectRoute(authRoles), membershipController.getMembershipById);

// Admin/Staff only routes
const adminRoles = ['admin', 'staff'];
router.post('/', protectRoute(adminRoles), membershipController.createMembership);
router.put('/:id', protectRoute(adminRoles), membershipController.updateMembership);
router.delete('/:id', protectRoute(adminRoles), membershipController.deleteMembership);

module.exports = router;