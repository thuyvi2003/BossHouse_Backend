const mongoose = require('mongoose');

const notificationReadSchema = new mongoose.Schema(
  {
    notification_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    read_at: { type: Date, default: Date.now }
  },
  {
    timestamps: false
  }
);

notificationReadSchema.index({ user_id: 1, notification_id: 1 }, { unique: true });

module.exports = mongoose.model('NotificationRead', notificationReadSchema);


