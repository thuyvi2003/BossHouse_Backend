// Vo Lam Thuy Vi
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Order = require("../models/order.model");
const ProductVariation = require("../models/productVariation.model");
const Promotion = require("../models/promotion.model");
const { calculateShippingFee } = require("../services/calculateShippingFee");

exports.createOrder = async (userId, selectedItemIds = [], promotionCode = null, shippingFee = null, addressInfo = {}) => {
  console.log("Creating order for user:", userId);
  console.log("Address Info:", addressInfo);
  console.log("Promotion Code:", promotionCode);
  if(!selectedItemIds || selectedItemIds.length === 0){
    throw new Error("No items selected for the order");
  }
//Find cart of user
  const cart = await Cart.findOne({ user_id: userId });
  if (!cart) throw new Error("Cart not found");
//Find cart items
  const cartItems = await CartItem.find({ _id: { $in: selectedItemIds } }).populate("variation_id");
  if (cartItems.length === 0) throw new Error("Your cart is empty");

  //  Calculate subtotal
  let subtotal = 0;
  const orderItems = cartItems.map((item) => {
    const price = item.variation_id.price;
    subtotal += price * item.quantity;
    return {
      product_id: item.variation_id.product_id,
      variation_id: item.variation_id,
      product_name: item.variation_id.name,
      quantity: item.quantity,
      price,
      subtotal: price * item.quantity,
    };
  });

  //  Calculate discount from promotion code
  let discount = 0;
  let promotionDoc = null;
if (promotionCode && typeof promotionCode === "string" && promotionCode.trim().toLowerCase() !== "null") {
  promotionDoc = await Promotion.findOne({ code: promotionCode, is_hidden: false });
  if (!promotionDoc) throw new Error("Invalid promotion code");

  if (promotionDoc.promotion_type === "percent") {
    discount = (promotionDoc.promotion_value / 100) * subtotal;
  } else {
    discount = promotionDoc.promotion_value;
  }

  if (discount > subtotal) discount = subtotal;

  await Promotion.findByIdAndUpdate(promotionDoc._id, { $inc: { used_count: 1 } });
}

  //  Calculate shipping fee
  let calculatedShippingFee = shippingFee;
  if (!shippingFee && addressInfo?.district && addressInfo?.ward) {
    try {
      const ghnFee = await calculateShippingFee({
        to_district: addressInfo.district,
        to_ward_code: addressInfo.ward,
      });
      calculatedShippingFee = ghnFee?.total || 30000; // fallback nếu GHN lỗi
      console.log("GHN Shipping Fee:", calculatedShippingFee);
    } catch (error) {
      console.error("Failed to calculate GHN fee:", error.message);
      calculatedShippingFee = 30000; // fallback mặc định
    }
  }

  //  Create order
  const order = await Order.create({
    user_id: userId,
    promotion_id: promotionDoc?._id || null,
    items: orderItems,
    subtotal,
    discount_amount: discount,
    shipping_fee: calculatedShippingFee || 30000,
    shipping_address: addressInfo,
    final_price: subtotal - discount + (calculatedShippingFee || 0),
    payment_method: addressInfo.payment_method || "cash",
    payment_status: "unpaid",
    status: "pending",
  });

  //  Trừ tồn kho
  for (const item of cartItems) {
    await ProductVariation.findByIdAndUpdate(item.variation_id._id, {
      $inc: { stock: -item.quantity },
    });
  }

  
  await CartItem.deleteMany({ _id: { $in: selectedItemIds } });

  console.log("Order created successfully:", order._id);
  return order;
};


exports.getAllOrders = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find()
      .populate({
        path: "user_id",
        select: "name email avatar",
      })
      .populate({
        path: "items.variation_id",
        populate: {
          path: "product_id",
          select: "name images price",
        },
      })
      .populate({
        path: "promotion_id",
        select: "code type value",
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(),
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};
