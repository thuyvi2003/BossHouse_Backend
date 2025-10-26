const express = require("express");
const wishlistController = require("../controllers/wishlist.controller");
const router = express.Router();
const protectRoute = require('../middleware/auth.middleware');



router.post('/', protectRoute(['user', 'veterinarian']), wishlistController.addToWishlist);
router.get('/', protectRoute(['user', 'veterinarian']), wishlistController.getWishlist);
router.delete('/delete/:id', protectRoute(['user', 'veterinarian']), wishlistController.removeWishlistItem);
router.delete('/clear', protectRoute(['user', 'veterinarian']), wishlistController.clearAllWishlist);
router.patch('/:id/move-to-cart', protectRoute(['user', 'veterinarian']), wishlistController.moveToCart);
router.patch('/:id/move-to-group', protectRoute(['user', 'veterinarian']), wishlistController.moveToGroup);
// Wishlist groups
router.get('/groups', protectRoute(['user', 'veterinarian']), wishlistController.getGroups);
router.post('/groups/create', protectRoute(['user', 'veterinarian']), wishlistController.createGroup);
router.post('/groups/:groupId/share', protectRoute(['user', 'veterinarian']), wishlistController.shareWishlistGroup);
router.patch('/groups/:groupId/unshare', protectRoute(['user', 'veterinarian'], wishlistController.disableShare));

module.exports = router;