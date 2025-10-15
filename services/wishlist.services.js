//Vo Lam Thuy Vi
const Wishlist = require("../models/wishlist.model");

exports.addToWishlist = async (userId, productVariationId, note) => {
  try {
    const item = await Wishlist.create({
      user_id: userId,
      product_variation_id: productVariationId,
      note,
    });
    if (!item) throw new Error('Failed to add to wishlist');
    console.log("hellloooooooo", item)
    const populatedItem = await Wishlist.findById(item._id)
      .populate({
        path: "product_variation_id",
        populate: { path: "product_id" }
      })
    return { success: true, message: "Added to wishlist", data: populatedItem };
  } catch (error) {
    if (error.code === 11000) {
      return {
        success: false,
        message: "Product already in wishlist"
      };
    }
    throw error;
  }
}
exports.getWishlist = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const wishlist = await Wishlist.find({ user_id: userId })
    .populate({
      path: "product_variation_id",
      populate: { path: "product_id" },
    })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 });
  const total = await Wishlist.countDocuments({ user_id: userId });
  return { wishlist, total };
}

