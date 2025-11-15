// Vo Lam Thuy Vi
const Cart = require("../models/cart.model");
const CartItem = require("../models/cartItem.model");
const Order = require("../models/order.model");
const ProductVariation = require("../models/productVariation.model");
const Promotion = require("../models/promotion.model");
const crypto = require("crypto");
const axios = require("axios");
let config = require("config");
const moment = require("moment");
let querystring = require("qs");
const { calculateShippingFee } = require("../services/calculateShippingFee");

exports.createOrder = async (
  userId,
  selectedItemIds = [],
  promotionCode = null,
  shippingFee = null,
  addressInfo = {},
  req
) => {
  console.log("Creating order for user:", userId);
  console.log("Address Info:", addressInfo);
  console.log("Promotion Code:", promotionCode);
  if (!selectedItemIds || selectedItemIds.length === 0) {
    throw new Error("No items selected for the order");
  }
  //Find cart of user
  const cart = await Cart.findOne({ user_id: userId });
  if (!cart) throw new Error("Cart not found");
  //Find cart items
  const cartItems = await CartItem.find({
    _id: { $in: selectedItemIds },
  }).populate("variation_id");
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
  if (
    promotionCode &&
    typeof promotionCode === "string" &&
    promotionCode.trim().toLowerCase() !== "null"
  ) {
    promotionDoc = await Promotion.findOne({
      code: promotionCode,
      is_hidden: false,
    });
    if (!promotionDoc) throw new Error("Invalid promotion code");

    if (promotionDoc.promotion_type === "percent") {
      discount = (promotionDoc.promotion_value / 100) * subtotal;
    } else {
      discount = promotionDoc.promotion_value;
    }

    if (discount > subtotal) discount = subtotal;

    await Promotion.findByIdAndUpdate(promotionDoc._id, {
      $inc: { used_count: 1 },
    });
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
  const final_price = subtotal - discount + (calculatedShippingFee || 0);
  //  Create order
  const order = await Order.create({
    user_id: userId,
    promotion_id: promotionDoc?._id || null,
    items: orderItems,
    subtotal,
    discount_amount: discount,
    shipping_fee: calculatedShippingFee || 30000,
    shipping_address: addressInfo,
    final_price,
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

  if (addressInfo.payment_method === "vnpay") {
    try {
      const paymentUrl = await generateVnpayPaymentUrl({
        orderId: order._id,
        amount: order.final_price,
        req,
      });
      console.log("Generated VNPAY payment URL:", paymentUrl);
      return { ...order.toObject(), paymentUrl };
    } catch (error) {
      console.error("Failed to generate VNPAY payment URL:", error.message);
    }
  }

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

exports.getOrderById = async (id) => {
  return await Order.findById(id)
    .populate("user_id", "name email")
    .populate("items.variation_id")
    .populate("promotion_id");
};

exports.getOrdersByUser = async (userId, page = 1, limit = 10, status) => {
  const skip = (page - 1) * limit;
  const query = { user_id: userId };
  if (status && status !== "all") query.status = status;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate({
        path: "items.variation_id",
        populate: { path: "product_id", select: "name images price" },
      })
      .populate({ path: "promotion_id", select: "code type value" })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: page,
  };
};

exports.updateOrderStatus = async (id, status) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Order not found");
  order.status = status;
  await order.save();
  return order;
};

exports.cancelOrder = async (userId, id) => {
  const order = await Order.findOne({ _id: id, user_id: userId });
  if (!order) throw new Error("Order not found or not authorized");
  if (order.status !== "pending")
    throw new Error("Only pending orders can be cancelled");
  order.status = "cancelled";
  await order.save();
  return order;
};

exports.filterOrders = async ({ status, startDate, endDate, userId }) => {
  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.created_at = {};
    if (startDate) query.created_at.$gte = new Date(startDate);
    if (endDate) query.created_at.$lte = new Date(endDate);
  }
  if (userId) query.user_id = userId;

  return await Order.find(query).sort({ created_at: -1 });
};

exports.searchOrders = async (keyword) => {
  const mongoose = require("mongoose");

  // If no keyword provided, return recent orders
  if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
    return await Order.find().sort({ created_at: -1 });
  }

  const or = [{ "items.product_name": { $regex: keyword, $options: "i" } }];

  // If keyword looks like a valid ObjectId, add exact _id match
  if (mongoose.Types.ObjectId.isValid(keyword)) {
    or.push({ _id: mongoose.Types.ObjectId(keyword) });
  }

  return await Order.find({ $or: or }).sort({ created_at: -1 });
};

exports.searchOrdersAdmin = async ({
  search = "",
  status = "",
  page = 1,
  limit = 10,
}) => {
  const query = {};

  // → Tạo regex 1 lần cho sạch
  const regex =
    search.trim() !== "" ? { $regex: search.trim(), $options: "i" } : null;

  // → Search by name or phone
  if (regex) {
    query.$or = [
      { "shipping_address.name": regex },
      { "shipping_address.phone": regex },
    ];
  }

  // → Filter by status
  if (status.trim() !== "") {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),

    Order.countDocuments(query),
  ]);

  return {
    orders,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

async function generateVnpayPaymentUrl({ amount, orderId, bankCode, req }) {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  let date = new Date();
  let createDate = moment(date).format("YYYYMMDDHHmmss");

  let ipAddr = "127.0.0.1";

  let tmnCode = config.get("vnp_TmnCode");
  let secretKey = config.get("vnp_HashSecret");
  let vnpUrl = config.get("vnp_Url");
  let returnUrl = config.get("vnp_ReturnUrl");

  let locale = "vn";

  let currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "" && bankCode !== undefined) {
    vnp_Params["vnp_BankCode"] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  return vnpUrl;
}

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
exports.verifyReturnAndUpdate = async function (params) {
  console.log("Verifying VNPAY return params:", params);
  let vnp_Params = { ...params };

  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  const secretKey = config.get("vnp_HashSecret");
  const signData = querystring.stringify(vnp_Params, { encode: false });

  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  // ❌ CHECKSUM FAILED
  if (secureHash !== signed) {
    return {
      success: false,
      code: "97",
      message: "Checksum failed",
    };
  }

  // 👉 Lấy orderId từ VNPAY
  const orderId = vnp_Params["vnp_TxnRef"];
  const responseCode = vnp_Params["vnp_ResponseCode"];
  const amount = Number(vnp_Params["vnp_Amount"]) / 100;

  // 👉 Tìm đơn hàng
  const order = await Order.findById(orderId);
  if (!order) {
    return {
      success: false,
      code: "01",
      message: "Order not found",
    };
  }

  // 👉 Kiểm tra số tiền
  if (order.final_price !== amount) {
    return {
      success: false,
      code: "04",
      message: "Amount invalid",
    };
  }

  // 👉 Nếu order đã cập nhật trước đó
  if (order.payment_status !== "unpaid") {
    return {
      success: true,
      code: "02",
      message: "Order already updated",
      order,
    };
  }

  // 👉 Update trạng thái thanh toán
  if (responseCode === "00") {
    order.payment_status = "paid";
  } else {
    order.payment_status = "unpaid";
  }

  await order.save();
  return {
    success: true,
    code: "00",
    message: "Payment updated successfully",
    data: vnp_Params, // ★★★ LỖI THIẾU NÈ ★★★
    order,
  };
};
