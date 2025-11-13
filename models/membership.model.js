const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    point: { type: Number, required: true, min: 0, default: 0 },
    description: { type: String, required: true, trim: true, maxlength: 1000 },

    // soft delete + status
    is_deleted: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },

    // audit
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// indexes
membershipSchema.index({ name: 1 });
membershipSchema.index({ is_deleted: 1, is_active: 1 });
membershipSchema.index({ point: 1 });

module.exports = mongoose.model('Membership', membershipSchema);