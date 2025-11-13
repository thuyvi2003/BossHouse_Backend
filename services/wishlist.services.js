//Vo Lam Thuy Vi
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Wishlist = require("../models/wishlist.model");
const wishlistGroup = require("../models/wishlistGroup.model");

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



exports.removeWishlistItem = async (userId, itemId) => {
  console.log("")
  const itemDeleted = await Wishlist.findOneAndDelete({
    _id: itemId,
    user_id: userId,
  });
  if (!itemDeleted) throw new Error("Item not found or already removed!");
  return itemDeleted;
};


exports.clearAllWishlist = async (userId, groupId = null) => {
  const filter = { user_id: userId };
  if (groupId) filter.group_id = groupId;
  const result = await Wishlist.deleteMany(filter);
  return result;
}


exports.moveToCart = async (userId, itemId) => {
  const item = await Wishlist.findOne({ _id: itemId, user_id: userId });
  if (!item) throw new Error("Wishlist item not found");
  let cart = await Cart.findOne({ user_id: userId });
  if (!cart) cart = await Cart.create({ user_id: userId });
  //Tim xem item nay da co trong cart roi chua
  let cartItem = await CartItem.findOne({
    cart_id: cart._id,
    variation_id: item.product_variation_id,
  });
  //Neu co roi thi tang quantity len
  if (cartItem) {
    cartItem.quantity += 1;
    await cartItem.save();
  } else { //Chua co thi create new Cart
    await CartItem.create({
      cart_id: cart._id,
      variation_id: item.product_variation_id,
      quantity: 1,
    });
  }
  await Wishlist.findByIdAndDelete(item._id);
  return { success: true, message: "Item moved to cart successfully" };

}

exports.markAsPurchased = async (userId, itemId) => {
  const item = await Wishlist.findOne({ _id: itemId, user_id: userId });
  if (!item) throw new Error("Wishlist item not found");
  if (item.is_purchased === true)
    return {
      success: false,
      message: "This item is already marked as purchased.",
    };

  item.is_purchased = true,
    item.purchased_at = new Date();
  await item.save();

  const updatedItem = await Wishlist.findById(item._id)
    .populate({
      path: "product_variation_id",
      populate: { path: "product_id" },
    });
  return {
    success: true,
    message: "Item marked as purchased successfully.",
    data: updatedItem,
  };
}

// Group wishlist area
exports.createGroup = async (userId, name, description) => {
  const group = await wishlistGroup.create({
    user_id: userId,
    name,
    description
  });
  return group;
}

exports.moveToGroup = async (userId, itemId, newGroupId) => {
  const item = await Wishlist.findOne({ _id: itemId, user_id: userId });
  if (!item) throw new Error("Item not found");

  if (item.group_id && item.group_id.toString() === newGroupId) {
    throw new Error("This item already belongs to the selected group.");
  }

  const updatedItem = await Wishlist.findOneAndUpdate(
    { _id: itemId, user_id: userId },
    { group_id: newGroupId },
    { new: true }
  ).populate("group_id");

  return updatedItem;
};



exports.getGroup = async (userId) => {
  const groups = await wishlistGroup.find({ user_id: userId })
    .populate({
      path: 'items',
      populate: {
        path: 'product_variation_id',
        populate: { path: 'product_id' },
      },
    })
    .sort({ created_at: -1 });

  return groups;
};




exports.shareWishlistGroup = async (userId, groupId, visibility = 'public') => {

  const group = await wishlistGroup.findOneAndUpdate(
    { _id: groupId, user_id: userId },
    {
      is_shared: true,
      visibility,
      share_token: groupId
    },
    { new: true }
  );
  if (!group) throw new Error('Group not found');
  return group;
}

exports.getSharedWishlistGroup = async (groupId) => {
  const group = await wishlistGroup
    .findOne({ _id: groupId, is_shared: true, visibility: 'public' })
    .populate({
      path: 'items',
      populate: {
        path: 'product_variation_id',
        populate: 'product_id',
      },
    })
    .populate('user_id', 'profile_image');

  if (!group) throw new Error('This wishlist group is not shared or does not exist.');
  return group;
};

exports.disableShare = async (userId, groupId) => {
  const group = await wishlistGroup.findOneAndUpdate({
    _id: groupId, user_id: userId
  },
    { is_shared: false, share_token: null },
    { new: true })
  return group;
}

exports.deleteGroup = async (userId, groupId) => {
  const group = await wishlistGroup.findOneAndDelete({
    _id: groupId,
    user_id: userId
  });
  if (!group) throw new Error('Group not found or already deleted');
  return group;
}