// Vo Lam Thuy Vi 
const orderService = require("../services/order.services");

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        const { selectedItemIds = [], promotionCode, shippingFee, addressInfo } = req.body;
        const order = await orderService.createOrder(userId, selectedItemIds, promotionCode, shippingFee, addressInfo);
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await orderService.getAllOrders(
            parseInt(page),
            parseInt(limit)
        );
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};



exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { page = 1, limit = 10 } = req.query;

    const result = await orderService.getOrdersByUser(
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


// exports.getOrderDetail = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { id } = req.params;
//     const order = await orderService.getOrderDetail(userId, id);
//     res.json({ success: true, data: order });
//   } catch (err) {
//     res.status(404).json({ success: false, message: err.message });
//   }
// };

// exports.cancelOrder = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { id } = req.params;
//     const order = await orderService.cancelOrder(userId, id);
//     res.json({ success: true, message: "Order cancelled", data: order });
//   } catch (err) {
//     res.status(400).json({ success: false, message: err.message });
//   }
// };

