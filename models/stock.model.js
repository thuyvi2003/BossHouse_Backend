const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
  variationId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductVariation", default: null },
  type: { type: String, enum: ["import", "adjustment", "return"], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true, min: 0 },
  newStock: { type: Number, required: true, min: 0 },
  supplier: { type: String, trim: true, maxlength: 200, default: "" },
  unitCost: { type: Number, min: 0, default: 0 },
  totalCost: { type: Number, min: 0, default: 0 },
  notes: { type: String, trim: true, maxlength: 500, default: "" },
  referenceNumber: { type: String, trim: true, maxlength: 100, default: "" },
  entryDate: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

stockSchema.index({ productId: 1 });
stockSchema.index({ variationId: 1 });
stockSchema.index({ type: 1 });
stockSchema.index({ entryDate: -1 });
stockSchema.index({ createdBy: 1 });
stockSchema.index({ isDeleted: 1 });
stockSchema.index({ created_at: -1 });

stockSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
stockSchema.set("toJSON", { virtuals: true });

stockSchema.pre("save", function (next) {
  if (!this.productId && !this.variationId)
    return next(new Error("Either productId or variationId must be provided"));
  if (this.productId && this.variationId)
    return next(new Error("Cannot have both productId and variationId"));
  next();
});

stockSchema.statics.findByProduct = function (productId) {
  return this.find({ productId, isDeleted: false }).sort({ entryDate: -1 });
};
stockSchema.statics.findByVariation = function (variationId) {
  return this.find({ variationId, isDeleted: false }).sort({ entryDate: -1 });
};
stockSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({ entryDate: { $gte: startDate, $lte: endDate }, isDeleted: false }).sort({ entryDate: -1 });
};

module.exports = mongoose.model("Stock", stockSchema);

