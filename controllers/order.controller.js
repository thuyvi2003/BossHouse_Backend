// Vo Lam Thuy Vi
const orderService = require("../services/order.services");
const nodemailer = require("nodemailer");
const { generatePDF } = require("../utils/pdfGenerator");

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      selectedItemIds = [],
      promotionCode,
      shippingFee,
      addressInfo,
    } = req.body;
    const order = await orderService.createOrder(
      userId,
      selectedItemIds,
      promotionCode,
      shippingFee,
      addressInfo,
      req
    );
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });

    // Send confirmation email asynchronously (do not block response)
    if (order && order.shipping_address && order.shipping_address.email) {
      exports
        .sendOrderConfirmationEmail(order)
        .then(() =>
          console.log(
            "Order confirmation email sent to",
            order.shipping_address.email
          )
        )
        .catch((emailErr) =>
          console.error(
            "Failed to send order confirmation email:",
            emailErr && emailErr.message ? emailErr.message : emailErr
          )
        );
    }
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
    const { page = 1, limit = 10, status = "all" } = req.query;

    const result = await orderService.getOrdersByUser(
      userId,
      parseInt(page),
      parseInt(limit),
      status
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

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedOrder = await orderService.updateOrderStatus(id, status);
    res.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const cancelledOrder = await orderService.cancelOrder(userId, id);
    res.json({
      success: true,
      message: "Order cancelled",
      data: cancelledOrder,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.filterOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, userId } = req.query;
    const result = await orderService.filterOrders({
      status,
      startDate,
      endDate,
      userId,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 8 } = req.query;

    const result = await orderService.searchOrdersAdmin({
      search,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.sendOrderConfirmationEmail = async (order) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: (process.env.EMAIL_PASS || "").trim(),
    },
  });

  // Build HTML receipt
  const itemsHtml = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td style="padding:6px 8px;border:1px solid #ddd">${
          it.product_name
        }</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:center">${
          it.quantity
        }</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${(
          it.price || 0
        ).toLocaleString("vi-VN")}đ</td>
        <td style="padding:6px 8px;border:1px solid #ddd;text-align:right">${(
          it.subtotal ||
          it.price * it.quantity ||
          0
        ).toLocaleString("vi-VN")}đ</td>
      </tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#333">
      <h2>Thank you for your order!</h2>
      <p>Order ID: <strong>${order._id}</strong></p>
      <p>Customer: ${order.shipping_address?.name || ""} &lt;${
    order.shipping_address?.email || ""
  }&gt;</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Product</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:center">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Price</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p style="text-align:right;margin-top:12px;font-weight:bold">Total: ${(
        order.final_price || 0
      ).toLocaleString("vi-VN")}đ</p>
      <h4>Shipping Address</h4>
      <p>
        ${order.shipping_address?.name || ""}<br/>
        ${order.shipping_address?.address || ""}, ${
    order.shipping_address?.ward || ""
  }, ${order.shipping_address?.district || ""}, ${
    order.shipping_address?.province || ""
  }<br/>
        Phone: ${order.shipping_address?.phone || ""}
      </p>
      <p>If you have any questions, reply to this email.</p>
    </div>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: order.shipping_address.email,
    subject: `Order Confirmation - ${order._id}`,
    text: `Thank you for your order! Your order ID is ${order._id}.`,
    html,
    attachments: [],
  };

  // Attach a PDF receipt if possible (generatePDF returns a Buffer)
  try {
    if (typeof generatePDF === "function") {
      const pdfBuffer = await generatePDF(order);
      if (pdfBuffer) {
        mailOptions.attachments.push({
          filename: `order_${order._id}.pdf`,
          content: pdfBuffer,
        });
      }
    }
  } catch (pdfErr) {
    console.error(
      "Failed to generate PDF attachment:",
      pdfErr && pdfErr.message ? pdfErr.message : pdfErr
    );
  }

  return transporter.sendMail(mailOptions);
};

exports.exportOrderBill = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const pdfBuffer = await generatePDF(order);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order_${id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to export bill" });
  }
};
exports.returnUrl = async (req, res) => {
  try {
    const result = await orderService.verifyReturnAndUpdate(req.query);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: "Checksum valid",
      data: result.data,
    });
  } catch (err) {
    console.error("VNPAY Return Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      code: "99",
    });
  }
};
