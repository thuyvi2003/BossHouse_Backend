const express = require("express");
const protectRoute = require("../middleware/auth.middleware");
const wishlistController = require("../controllers/wishlist.controller");
const router = express.Router();


router.post('/',protectRoute(['user','veterinarian']),wishlistController.addToWishlist);
router.get('/',protectRoute(['user','veterinarian']),wishlistController.getWishlist);

module.exports = router;