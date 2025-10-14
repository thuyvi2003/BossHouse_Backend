//Vo Lam Thuy Vi
const Wishlist = require("../models/wishlist.model");

exports.addToWishlist = async (userId, productVariationId, note) => {
  try {
      const item = await Wishlist.create({
        user_id: userId,
        product_variation_id: productVariationId,
        note,
    });
    if(!item) throw new Error('Failed to add to wishlist');
    console.log("hellloooooooo", item)
    const populatedItem = await Wishlist.findById(item._id)
        .populate({
          path: "product_variation_id",
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
exports.getWishlist = async (userId) => {
    const wishList = await Wishlist.find({user_id: userId})
      .populate("product_variation_id")
      .sort({ created_at: -1 }); //Loc san pham moi them vao wishlist len dau
      if(!wishList) throw new Error('Failed to get wishlist');
      return wishList;
}

