const Stock = require("../models/stock.model.js");
const Product = require("../models/product.model.js");
const ProductVariation = require("../models/productVariation.model.js");

const createStock = async (d) => {
  const {
    productId,
    variationId,
    type,
    quantity,
    supplier,
    unitCost,
    notes,
    referenceNumber,
    entryDate,
    createdBy,
  } = d;
  if ((!productId && !variationId) || (productId && variationId))
    throw new Error("Invalid product/variation");
  const item = productId
    ? await Product.findOne({ _id: productId, isDeleted: false })
    : await ProductVariation.findOne({ _id: variationId, isDeleted: false });
  if (!item)
    throw new Error(
      productId ? "Product not found" : "Product variation not found"
    );
  const prevStock = item.stock || 0;
  let newStock =
    type === "adjustment"
      ? prevStock + quantity
      : prevStock + Math.abs(quantity);
  if (newStock < 0) throw new Error("Stock cannot be negative");
  const totalCost = (unitCost || 0) * Math.abs(quantity);
  const entry = await Stock.create({
    productId: productId || null,
    variationId: variationId || null,
    type,
    quantity: type === "adjustment" ? quantity : Math.abs(quantity),
    previousStock: prevStock,
    newStock,
    supplier: supplier || "",
    unitCost: unitCost || 0,
    totalCost,
    notes: notes || "",
    referenceNumber: referenceNumber || "",
    entryDate: entryDate || new Date(),
    createdBy,
  });
  if (productId)
    await Product.findByIdAndUpdate(productId, { stock: newStock });
  else {
    await ProductVariation.findByIdAndUpdate(variationId, { stock: newStock });
    const v = await ProductVariation.findById(variationId);
    if (v?.product_id) {
      const p = await Product.findById(v.product_id);
      if (p) await p.updateStockFromVariations();
    }
  }
  const populated = await Stock.findById(entry._id)
    .populate("productId", "name price image")
    .populate("variationId", "name price image")
    .populate("createdBy", "name email");
  return { success: true, data: populated };
};

const getAllStocks = async (q) => {
  const {
    page = 1,
    limit = 10,
    productId,
    variationId,
    type,
    startDate,
    endDate,
    supplier,
    createdBy,
    sortBy = "entryDate",
    sortOrder = "desc",
  } = q;
  const f = { isDeleted: false };
  if (productId) f.productId = productId;
  if (variationId) f.variationId = variationId;
  if (["import", "adjustment", "return"].includes(type)) f.type = type;
  if (supplier) f.supplier = { $regex: supplier, $options: "i" };
  if (createdBy) f.createdBy = createdBy;
  if (startDate || endDate) {
    f.entryDate = {};
    if (startDate) f.entryDate.$gte = new Date(startDate);
    if (endDate) f.entryDate.$lte = new Date(endDate);
  }
  const skip = (+page - 1) * +limit;
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  const [stocks, totalItems] = await Promise.all([
    Stock.find(f)
      .populate("productId", "name price image")
      .populate("variationId", "name price image")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(+limit),
    Stock.countDocuments(f),
  ]);
  return {
    success: true,
    data: stocks,
    pagination: {
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(totalItems / +limit),
      totalItems,
    },
  };
};

const getStockById = async (id) => {
  const stock = await Stock.findOne({ _id: id, isDeleted: false })
    .populate("productId", "name price image categoryId")
    .populate("variationId", "name price image product_id")
    .populate("createdBy", "name email");
  if (!stock) throw new Error("Stock entry not found");
  return { success: true, data: stock };
};

const updateStock = async (id, d) => {
  const {
    type,
    quantity,
    supplier,
    unitCost,
    notes,
    referenceNumber,
    entryDate,
  } = d;
  const stock = await Stock.findOne({ _id: id, isDeleted: false });
  if (!stock) throw new Error("Stock entry not found");
  const item = stock.productId
    ? await Product.findById(stock.productId)
    : await ProductVariation.findById(stock.variationId);
  if (!item)
    throw new Error(
      stock.productId ? "Product not found" : "Product variation not found"
    );
  let curr = item.stock;
  const oldEffect = stock.newStock - stock.previousStock;
  const stockAfterReversal = curr - oldEffect;
  const newQuantity = quantity ?? stock.quantity;
  const newType = type ?? stock.type;
  let newEffect =
    newType === "adjustment" ? newQuantity : Math.abs(newQuantity);
  const finalStock = stockAfterReversal + newEffect;
  if (finalStock < 0) throw new Error("Stock cannot be negative");
  const finalUnitCost = unitCost ?? stock.unitCost;
  const updateObj = {
    previousStock: stockAfterReversal,
    newStock: finalStock,
    totalCost: finalUnitCost * Math.abs(newQuantity),
    ...(type !== undefined && { type }),
    ...(quantity !== undefined && {
      quantity: newType === "adjustment" ? newQuantity : Math.abs(newQuantity),
    }),
    ...(supplier !== undefined && { supplier }),
    ...(unitCost !== undefined && { unitCost }),
    ...(notes !== undefined && { notes }),
    ...(referenceNumber !== undefined && { referenceNumber }),
    ...(entryDate !== undefined && { entryDate }),
  };
  const updated = await Stock.findByIdAndUpdate(id, updateObj, {
    new: true,
    runValidators: true,
  })
    .populate("productId", "name price image")
    .populate("variationId", "name price image")
    .populate("createdBy", "name email");
  if (stock.productId)
    await Product.findByIdAndUpdate(stock.productId, { stock: finalStock });
  else {
    await ProductVariation.findByIdAndUpdate(stock.variationId, {
      stock: finalStock,
    });
    const v = await ProductVariation.findById(stock.variationId);
    if (v?.product_id) {
      const p = await Product.findById(v.product_id);
      if (p) await p.updateStockFromVariations();
    }
  }
  return { success: true, data: updated };
};

const softDeleteStock = async (id) => {
  const stock = await Stock.findOne({ _id: id, isDeleted: false });
  if (!stock) throw new Error("Stock entry not found");
  const item = stock.productId
    ? await Product.findById(stock.productId)
    : await ProductVariation.findById(stock.variationId);
  if (!item)
    throw new Error(
      stock.productId ? "Product not found" : "Product variation not found"
    );
  let curr = item.stock;
  const stockEffect = stock.newStock - stock.previousStock;
  const newStock = curr - stockEffect;
  if (newStock < 0)
    throw new Error(
      "Cannot delete stock entry: would result in negative stock"
    );
  await Stock.findByIdAndUpdate(id, { isDeleted: true });
  if (stock.productId)
    await Product.findByIdAndUpdate(stock.productId, { stock: newStock });
  else {
    await ProductVariation.findByIdAndUpdate(stock.variationId, {
      stock: newStock,
    });
    const v = await ProductVariation.findById(stock.variationId);
    if (v?.product_id) {
      const p = await Product.findById(v.product_id);
      if (p) await p.updateStockFromVariations();
    }
  }
  return { success: true };
};

const getStockStats = async () => {
  const [
    totalEntries,
    totalImports,
    totalAdjustments,
    totalReturns,
    totalValue,
  ] = await Promise.all([
    Stock.countDocuments({ isDeleted: false }),
    Stock.countDocuments({ type: "import", isDeleted: false }),
    Stock.countDocuments({ type: "adjustment", isDeleted: false }),
    Stock.countDocuments({ type: "return", isDeleted: false }),
    Stock.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$totalCost" } } },
    ]),
  ]);
  return {
    success: true,
    data: {
      totalEntries,
      totalImports,
      totalAdjustments,
      totalReturns,
      totalValue: totalValue[0]?.total || 0,
    },
  };
};

module.exports = {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  softDeleteStock,
  getStockStats,
};
