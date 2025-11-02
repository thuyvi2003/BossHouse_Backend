//Vo Lam Thuy Vi
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Order = require("../models/order.model");
const ProductVariation = require("../models/productVariation.model");
const Promotion = require("../models/promotion.model");

exports.createOrder = async (userId, promotionCode = null, shippingFee = 30000, addressInfo = {}) => {
            console.log("Promotion",promotionCode);
    
    //Find cart of user
    const cart = await Cart.findOne({ user_id: userId });
    if (!cart) throw new Error('Cart not found');
    //Find cart item in cart
    const cartItems = await CartItem.find({ cart_id: cart._id }).populate('variation_id');
    if (cartItems.length === 0) throw new Error('Your cart is empty');

    //Subtotal 
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

    //Have promotion
    let discount = 0;
    let promotionDoc = null;

    if (promotionCode) { //Truy xuat document cua promtion co code trung voi code
        promotionDoc = await Promotion.findOne({
            code: promotionCode,
            is_hidden: false,
        })
        if (!promotionDoc) throw new Error('Invalid promotion');
        if (promotionDoc.promotion_type === 'percent') {
            discount = (promotionDoc.promotion_value / 100) * subtotal;
        } else {
            discount = promotionDoc.promotion_value;
        }
        //Gio han neu ma giam gia lon hon tong tien hang chua giam gia thi se giam bang so tien discount
        if (discount > subtotal) discount = subtotal;
        //Update so lan dung ma 
        await Promotion.findByIdAndUpdate(promotionDoc._id, { $inc: { used_count: 1 } })
    }


    // Create order
    const order = await Order.create({
        user_id: userId,
        promotion_id: promotionDoc?._id || null,
        items: orderItems,
        subtotal,
        discount_amount: discount,
        shipping_fee: shippingFee,
        shipping_address: addressInfo,
        final_price: subtotal - discount + shippingFee,
    });

    //Tru stock
    for (const item of cartItems) {
        await ProductVariation.findByIdAndUpdate(item.variation_id._id, {
            $inc: { stock: -item.quantity }
        })
    }
    await CartItem.deleteMany({ cart_id: cart._id })
    return order;
}





exports.getAllOrders = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const orders = await Order.find()
        .populate("user_id")
        .populate("promotion_id")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await Order.countDocuments();
    return { total, orders }
}


exports.getOrdersByUser = async (userId, page = 1, limit = 6) => {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ user_id: userId })
      .populate("promotion_id")
      .populate({
        path: "items.variation_id", 
        populate: {                 
          path: "product_id",
          select: "name images category_id",
        },
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user_id: userId }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    status: "success",
    data: orders,
    pagination: { total, totalPages, page },
  };
};
