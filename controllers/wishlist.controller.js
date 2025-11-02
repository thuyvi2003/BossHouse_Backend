const wishlistService = require("../services/wishlist.services");

exports.addToWishlist = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { product_variation_id, note } = req.body;
        const result = await wishlistService.addToWishlist(user_id, product_variation_id, note)
        if (!result.success) return res.status(400).json(result);
        res.status(201).json({
            status: 'success',
            message: 'Add to wishlist is successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
exports.getWishlist = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const { wishlist, total } = await wishlistService.getWishlist(user_id);
        res.status(200).json({
            status: "success",
            message: "Get wishlist successfully",
            data: wishlist,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        next(error)
    }
}

exports.removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user._id;  
    const { id } = req.params;
    const result = await wishlistService.removeWishlistItem(userId, id);

    res.json({
      success: true,
      message: 'Item removed',
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
exports.clearAllWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        const { group_id } = req.query;
        const result = await wishlistService.clearAllWishlist(userId, group_id || null);
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} items`,
            data: result,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.moveToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const result = await wishlistService.moveToCart(userId, id);
        res.json({
            success: true,
            message: "Move to cart successfully",
            status: "success",
            data: result
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.markAsPurchased = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const result = await wishlistService.markAsPurchased(userId, id);
        res.json({
            success: true,
            message: "Mark ad purchased successfully",
            status: "success",
            data: result
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};


//Group wishlist area
exports.moveToGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const { newGroupId } = req.body;
        console.log("Group_id", newGroupId)
        const result = await wishlistService.moveToGroup(userId, id, newGroupId);
        res.json({
            success: true,
            status: "success",
            message: 'Item moved to new group',
            data: result
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await wishlistService.getGroup(userId);
        res.json({
            success: true,
            status: "success",
            message: "Get wishlist group successfully",
            data: groups
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, description } = req.body;
        const group = await wishlistService.createGroup(userId, name, description);
        res.status(201).json({
            message: "Create group wishlist is successfully",
            status: "success",
            success: true,
            data: group
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};
exports.shareWishlistGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;
        const { visibility = 'public' } = req.body;
        const group = await wishlistService.shareWishlistGroup(userId, groupId, visibility);
        const shareUrl = `http://localhost:5173/share/wishlist/${group._id}`;
        res.json({
            success: true,
            message: 'Wishlist shared successfully',
            share_url: shareUrl,
            data: group,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

exports.getSharedWishlistGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await wishlistService.getSharedWishlistGroup(groupId);

    res.json({
      success: true,
      message: 'Shared wishlist retrieved successfully',
      data: group,
    });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.disableShare = async (req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;
        const group = await wishlistService.disableShare(userId, groupId);
        res.json({
            success: true,
            message: 'Sharing disabled',
            data: group
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};
exports.deleteGroup = async (req, res) => {
    try {
        const userId = req.user._id;
        const { groupId } = req.params;
        const group = await wishlistService.deleteGroup(userId, groupId);
        res.json({
            success: true,
            message: 'Group deleted successfully',
            data: group
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

