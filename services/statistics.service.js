const mongoose = require("mongoose");
const Order = require("../models/order.model");

// Helper function to build base aggregation pipeline with filters
const buildBasePipeline = ({ startDate, endDate, paymentMethod, categoryId }) => {
  const matchStage = {
    payment_status: "paid", // Only count paid orders
    status: { $ne: "cancelled" }, // Exclude cancelled orders
  };

  // Date range filter
  if (startDate || endDate) {
    matchStage.created_at = {};
    if (startDate) {
      matchStage.created_at.$gte = new Date(startDate);
    }
    if (endDate) {
      matchStage.created_at.$lte = new Date(endDate);
    }
  }

  // Payment method filter
  if (paymentMethod) {
    matchStage.payment_method = paymentMethod;
  }

  // Base pipeline: match orders, unwind items, lookup products
  const pipeline = [
    { $match: matchStage },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
  ];

  // Category filter
  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    pipeline.push({
      $match: { "product.categoryId": new mongoose.Types.ObjectId(categoryId) },
    });
  }

  return pipeline;
};

// Aggregate order revenue with filters
const aggregateOrderRevenue = async (filters) => {
  const pipeline = buildBasePipeline(filters);

  // Group by order to get revenue and cost per order
  pipeline.push({
    $group: {
      _id: "$_id",
      created_at: { $first: "$created_at" },
      payment_method: { $first: "$payment_method" },
      revenue: { $sum: "$items.subtotal" },
      discount_amount: { $first: "$discount_amount" },
      shipping_fee: { $first: "$shipping_fee" },
    },
  });

  // Add cost calculation (discount + shipping + 30% operational cost)
  pipeline.push({
    $addFields: {
      cost: {
        $add: [
          { $ifNull: ["$discount_amount", 0] },
          { $ifNull: ["$shipping_fee", 0] },
          { $multiply: ["$revenue", 0.3] }, // SỬA: dùng $revenue thay vì $sum
        ],
      },
    },
  });

  return Order.aggregate(pipeline);
};
// Aggregate revenue by category
const aggregateCategoryBreakdown = async (filters) => {
  const pipeline = buildBasePipeline(filters);

  // Group by category
  pipeline.push({
    $group: {
      _id: "$product.categoryId",
      revenue: { $sum: "$items.subtotal" },
    },
  });

  // Lookup category details
  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
    }
  );

  return Order.aggregate(pipeline);
};

// Aggregate top products by revenue
const aggregateTopProducts = async (filters) => {
  const pipeline = buildBasePipeline(filters);

  pipeline.push(
    {
      $group: {
        _id: "$items.product_id",
        revenue: { $sum: "$items.subtotal" },
        quantity: { $sum: "$items.quantity" },
        nameFromOrder: { $first: "$items.product_name" },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        productName: { $ifNull: ["$product.name", "$nameFromOrder"] },
        revenue: 1,
        quantity: 1,
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  );

  return Order.aggregate(pipeline);
};

// Main function to get revenue statistics
const getRevenueStatistics = async ({
  startDate,
  endDate,
  categoryId,
  paymentMethod,
} = {}) => {
  try {
    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date(defaultEndDate);
    defaultStartDate.setDate(defaultEndDate.getDate() - 29); // 30 days inclusive

    const filters = {
      startDate: startDate || defaultStartDate,
      endDate: endDate || defaultEndDate,
      categoryId: categoryId || null,
      paymentMethod: paymentMethod || null,
    };

    // Get all order revenue data
    const orderRevenue = await aggregateOrderRevenue(filters);

        // Calculate totals
        const totalRevenue = orderRevenue.reduce(
          (sum, order) => sum + (order.revenue || 0),
          0
        );
        const totalOrders = orderRevenue.length; // THÊM DÒNG NÀY
        const totalCost = orderRevenue.reduce(
          (sum, order) => sum + (order.cost || 0),
          0
        );
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // Build revenue trend (daily breakdown)
        // Build revenue trend với cost (daily breakdown)
        const revenueTrendMap = {};
        const costTrendMap = {};
        orderRevenue.forEach((order) => {
          if (order.created_at) {
            const dateKey = new Date(order.created_at).toISOString().split("T")[0];
            revenueTrendMap[dateKey] = (revenueTrendMap[dateKey] || 0) + (order.revenue || 0);
            costTrendMap[dateKey] = (costTrendMap[dateKey] || 0) + (order.cost || 0);
          }
        });
    
        const revenueTrend = Object.keys(revenueTrendMap)
          .map((date) => ({
            date,
            revenue: revenueTrendMap[date],
            cost: costTrendMap[date] || 0,
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Build payment method breakdown
    const paymentBreakdownMap = {};
    orderRevenue.forEach((order) => {
      const method = order.payment_method || "unknown";
      paymentBreakdownMap[method] = (paymentBreakdownMap[method] || 0) + order.revenue;
    });

    const paymentBreakdown = Object.entries(paymentBreakdownMap).map(
      ([method, revenue]) => ({
        method,
        revenue,
      })
    );

    // Get category breakdown
    const categoryBreakdownRaw = await aggregateCategoryBreakdown(filters);
    const categoryBreakdown = categoryBreakdownRaw.map((item) => ({
      categoryId: item._id,
      categoryName: item.category?.name || "Uncategorized",
      revenue: item.revenue || 0,
    }));

    // Get top products
    const topProducts = await aggregateTopProducts(filters);

    return {
      totalRevenue,
      totalCost,
      totalOrders,
      avgOrderValue,
      revenueTrend,
      paymentBreakdown,
      categoryBreakdown,
      topProducts,
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        categoryId: filters.categoryId,
        paymentMethod: filters.paymentMethod,
      },
    };
  } catch (error) {
    console.error("Error in getRevenueStatistics:", error);
    throw error;
  }
};

module.exports = {
  getRevenueStatistics,
};