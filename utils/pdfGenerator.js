const PDFDocument = require("pdfkit");
const fs = require("fs");

function formatCurrency(num) {
  try {
    return Number(num || 0).toLocaleString("vi-VN") + " VND";
  } catch (e) {
    return (num || 0) + " VND";
  }
}

exports.generatePDF = async (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Try to use a system font that supports Vietnamese characters (Windows)
    const arialPath = "C:/Windows/Fonts/arial.ttf";
    if (fs.existsSync(arialPath)) {
      try {
        doc.font(arialPath);
      } catch (e) {
        // fallback to built-in font
      }
    }

    // Header
    doc.fontSize(22).text("Order Invoice", { align: "center" });
    doc.moveDown(0.5);

    // Order / Customer block
    const leftX = doc.x;
    doc.fontSize(10).fontSize(11).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`);
    doc.moveDown(0.2);
    doc.fontSize(11).text(`Customer: ${order.shipping_address?.name || "-"}`);
    doc.text(`Email: ${order.shipping_address?.email || "-"}`);
    doc.text(`Phone: ${order.shipping_address?.phone || "-"}`);
    doc.moveDown(0.2);
    const addr = [
      order.shipping_address?.address,
      order.shipping_address?.ward,
      order.shipping_address?.district,
      order.shipping_address?.province,
      order.shipping_address?.country,
    ]
      .filter(Boolean)
      .join(", ");
    doc.text(`Address: ${addr || "-"}`);

    doc.moveDown(0.8);

    // Items table header
    const tableTop = doc.y;
    const itemX = leftX;
    const qtyX = 330;
    const priceX = 380;
    const subtotalX = 470;

    doc.fontSize(12).text("Items", itemX, tableTop);
    doc.moveDown(0.3);

    // Table column titles
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Product", itemX, doc.y, { width: qtyX - itemX - 10 });
    doc.text("Qty", qtyX, doc.y, {
      width: priceX - qtyX - 10,
      align: "center",
    });
    doc.text("Price", priceX, doc.y, {
      width: subtotalX - priceX - 10,
      align: "right",
    });
    doc.text("Subtotal", subtotalX, doc.y, { align: "right" });
    doc.moveDown(0.2);
    doc.font("Helvetica");

    // Draw items
    (order.items || []).forEach((item, i) => {
      const y = doc.y;
      const name = `${i + 1}. ${item.product_name}`;
      doc.text(name, itemX, y, { width: qtyX - itemX - 10 });
      doc.text(String(item.quantity), qtyX, y, {
        width: priceX - qtyX - 10,
        align: "center",
      });
      doc.text(formatCurrency(item.price), priceX, y, {
        width: subtotalX - priceX - 10,
        align: "right",
      });
      doc.text(
        formatCurrency(item.subtotal || item.price * item.quantity),
        subtotalX,
        y,
        { align: "right" }
      );
      doc.moveDown(0.6);
    });

    // Horizontal rule
    const hrY = doc.y;
    doc.moveTo(itemX, hrY).lineTo(540, hrY).strokeColor("#AAAAAA").stroke();
    doc.moveDown(0.6);

    // Summary on right
    const summaryX = 350;
    const labelWidth = 100;
    doc
      .fontSize(11)
      .text("Subtotal:", summaryX, doc.y, { width: labelWidth, align: "left" });
    doc.text(formatCurrency(order.subtotal), summaryX + labelWidth, doc.y, {
      align: "right",
    });
    doc.moveDown(0.4);
    doc.text("Discount:", summaryX, doc.y, {
      width: labelWidth,
      align: "left",
    });
    doc.text(
      formatCurrency(order.discount_amount || 0),
      summaryX + labelWidth,
      doc.y,
      { align: "right" }
    );
    doc.moveDown(0.4);
    doc.text("Shipping Fee:", summaryX, doc.y, {
      width: labelWidth,
      align: "left",
    });
    doc.text(
      formatCurrency(order.shipping_fee || 0),
      summaryX + labelWidth,
      doc.y,
      { align: "right" }
    );
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold");
    doc.text("Final Price:", summaryX, doc.y, {
      width: labelWidth,
      align: "left",
    });
    doc.text(
      formatCurrency(order.final_price || 0),
      summaryX + labelWidth,
      doc.y,
      { align: "right" }
    );
    doc.font("Helvetica");

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text("Thank you for your order!", { align: "center" });

    doc.end();
  });
};
