const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 200 
    },
    content: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 1000 
    },
    type: { 
      type: String, 
      enum: ['info', 'warning', 'success', 'error', 'promotion', 'booking', 'review', 'system'], 
      required: true,
      default: 'info'
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    target_audience: { 
      type: String, 
      enum: ['all', 'admin', 'staff', 'veterinarian', 'user', 'specific'], 
      required: true,
      default: 'all'
    },
    target_users: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }], // For specific users
    status: { 
      type: String, 
      enum: ['active', 'inactive'], 
      default: 'active' 
    },
    scheduled_at: { 
      type: Date 
    }, // For scheduled notifications
    expires_at: { 
      type: Date 
    }, // For expiring notifications
    created_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    created_by_role: { 
      type: String, 
      enum: ['admin', 'staff', 'veterinarian', 'user'], 
      required: true 
    },
    read_count: { 
      type: Number, 
      default: 0 
    },
    total_sent: { 
      type: Number, 
      default: 0 
    },
    // For tracking notification delivery
    delivery_status: { 
      type: String, 
      enum: ['pending', 'sent', 'failed', 'partial'], 
      default: 'pending' 
    },
    // Optional: Link to related entity
    related_type: { 
      type: String, 
      enum: ['product', 'service', 'booking', 'review', 'post', 'promotion', 'event'] 
    },
    related_id: { 
      type: mongoose.Schema.Types.ObjectId 
    },
    // Rich content support
    image_url: { 
      type: String, 
      trim: true 
    },
    action_url: { 
      type: String, 
      trim: true 
    }, // URL to redirect when clicked
    action_text: { 
      type: String, 
      trim: true, 
      maxlength: 50 
    } // Button text like "View Details", "Book Now"
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes for performance
notificationSchema.index({ target_audience: 1, status: 1, created_at: -1 });
notificationSchema.index({ created_by: 1, created_at: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ scheduled_at: 1, status: 1 });
notificationSchema.index({ expires_at: 1, status: 1 });
notificationSchema.index({ title: 'text', content: 'text' }); // Text search

module.exports = mongoose.model('Notification', notificationSchema);
