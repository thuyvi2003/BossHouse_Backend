const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { getIO } = require('./socket');
const NotificationRead = require('../models/notificationRead.model');

/**
 * 80. Create Notification - Admin only
 */
exports.createNotification = async (notificationData, userId, userRole) => {
    try {
        // Validate required fields
        if (!notificationData.title || !notificationData.content) {
            throw new Error('Title and content are required');
        }

        // Set default values
        const notification = new Notification({
            ...notificationData,
            created_by: userId,
            created_by_role: userRole,
            status: 'active' // Always create as active
        });

        await notification.save();
        
        // Populate creator info
        await notification.populate('created_by', 'name email');
        
        // Emit realtime notification via Socket.IO
        try {
            const io = getIO();
            const payload = {
                _id: notification._id,
                title: notification.title,
                content: notification.content,
                status: notification.status,
                target_audience: notification.target_audience,
                target_users: notification.target_users,
                created_at: notification.created_at,
            };
            if (notification.target_audience === 'specific' && Array.isArray(notification.target_users)) {
                notification.target_users.forEach(uid => {
                    io.to(String(uid)).emit('notification:new', payload);
                });
            } else {
                io.emit('notification:new', payload);
            }
        } catch (e) {
            // socket not initialized or other realtime issue; do not block creation
        }

        return notification;
    } catch (error) {
        throw new Error(`Error creating notification: ${error.message}`);
    }
};

/**
 * 81. View Notification List - Admin/Staff/Veterinarian/User
 */
exports.getAllNotifications = async (filters = {}, userRole = 'user', userId = null) => {
    try {
        const {
            type,
            priority,
            status,
            target_audience,
            search,
            read_status,
            page = 1,
            limit = 10,
            sort = '-created_at'
        } = filters;

        const query = {};

        // Basic filters
        if (type) query.type = type;
        if (priority) query.priority = priority;
        if (target_audience) query.target_audience = target_audience;
        
        // Status filter based on role
        if (userRole === 'admin') {
            if (status) query.status = status;
            // Admin can see all statuses
        } else {
            // Non-admin users only see active notifications
            query.status = 'active';
        }

        // Build complex query with $and if needed
        const andConditions = [];
        
        // Search filter
        if (search) {
            andConditions.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } }
                ]
            });
        }

        // Target audience filter
        if (userRole !== 'admin') {
            andConditions.push({
                $or: [
                    { target_audience: 'all' },
                    { target_audience: userRole },
                    { target_users: userId }
                ]
            });
        }

        // If we have andConditions, use $and
        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        // Get all notifications first
        const skip = (page - 1) * limit;
        const sortObj = {};
        if (sort.startsWith('-')) {
            sortObj[sort.substring(1)] = -1;
        } else {
            sortObj[sort] = 1;
        }

        const [allNotifications, total] = await Promise.all([
            Notification.find(query)
                .populate('created_by', 'name email')
                .sort(sortObj)
                .lean(),
            Notification.countDocuments(query)
        ]);

        // Attach read status and filter
        let notificationsWithRead = allNotifications;
        if (userId) {
            try {
                const ids = allNotifications.map(n => n._id);
                console.log('Looking for read status for user:', userId);
                console.log('Notification IDs:', ids.slice(0, 3)); // Show first 3 IDs
                
                const readDocs = await NotificationRead.find({ user_id: userId, notification_id: { $in: ids } }, 'notification_id');
                console.log('Found read documents:', readDocs.length);
                console.log('Read docs:', readDocs.slice(0, 3)); // Show first 3
                
                const readSet = new Set(readDocs.map(d => String(d.notification_id)));
                notificationsWithRead = allNotifications.map(n => ({ ...n, is_read: readSet.has(String(n._id)) }));
                
                console.log('Read status mapping:', notificationsWithRead.slice(0, 3).map(n => ({ 
                    id: n._id, 
                    title: n.title, 
                    is_read: n.is_read 
                })));
                
                // Filter by read status if specified
                if (read_status === 'read') {
                    notificationsWithRead = notificationsWithRead.filter(n => n.is_read === true);
                    console.log('After READ filter:', notificationsWithRead.length);
                } else if (read_status === 'unread') {
                    notificationsWithRead = notificationsWithRead.filter(n => n.is_read === false);
                    console.log('After UNREAD filter:', notificationsWithRead.length);
                }
            } catch (readError) {
                console.error('Error processing read status:', readError);
                // Fallback: mark all as unread if there's an error
                notificationsWithRead = allNotifications.map(n => ({ ...n, is_read: false }));
            }
        }

        // Apply pagination after filtering
        const startIndex = skip;
        const endIndex = skip + parseInt(limit);
        const notifications = notificationsWithRead.slice(startIndex, endIndex);
        
        // Debug logging
        console.log('=== NOTIFICATION FILTER DEBUG ===');
        console.log('Filter params:', { read_status, userId, userRole });
        console.log('All notifications:', allNotifications.length);
        console.log('After read status filter:', notificationsWithRead.length);
        console.log('Final notifications:', notifications.length);
        if (notifications.length > 0) {
            console.log('First notification is_read:', notifications[0].is_read);
            console.log('Sample notification:', {
                id: notifications[0]._id,
                title: notifications[0].title,
                is_read: notifications[0].is_read
            });
        }
        console.log('================================');

        return {
            notifications: notifications,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(notificationsWithRead.length / limit),
                total_items: notificationsWithRead.length,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error getting notifications: ${error.message}`);
    }
};

/**
 * 82. View Notification Detail - Admin/Staff/Veterinarian/User
 */
exports.getNotificationById = async (notificationId, userRole = 'user', userId = null) => {
    try {
        const query = { _id: notificationId };
        
        // Non-admin users can only see active notifications
        if (userRole !== 'admin') {
            query.status = 'active';
            query.$or = [
                { target_audience: 'all' },
                { target_audience: userRole },
                { target_users: userId }
            ];
        }

        const notification = await Notification.findOne(query)
            .populate('created_by', 'name email');

        if (!notification) {
            throw new Error('Notification not found or not accessible');
        }

        if (userId) {
            const read = await NotificationRead.findOne({ user_id: userId, notification_id: notificationId });
            const obj = notification.toObject();
            obj.is_read = !!read;
            return obj;
        }
        return notification;
    } catch (error) {
        throw new Error(`Error getting notification: ${error.message}`);
    }
};

/**
 * 83. Edit Notification - Admin only
 */
exports.updateNotification = async (notificationId, updateData, userId, userRole) => {
    try {
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            throw new Error('Notification not found');
        }

        // Only admin can edit notifications
        if (userRole !== 'admin') {
            throw new Error('Only admin can edit notifications');
        }

        // Update allowed fields
        const allowedFields = [
            'title', 'content', 'type', 'priority', 'target_audience', 
            'target_users', 'status', 'scheduled_at', 'expires_at',
            'image_url', 'action_url', 'action_text', 'related_type', 'related_id'
        ];
        
        const updateFields = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields[field] = updateData[field];
            }
        });

        const updatedNotification = await Notification.findByIdAndUpdate(
            notificationId,
            updateFields,
            { new: true, runValidators: true }
        ).populate('created_by', 'name email');

        return updatedNotification;
    } catch (error) {
        throw new Error(`Error updating notification: ${error.message}`);
    }
};

/**
 * Mark as read/unread for a user
 */
exports.setReadStatus = async (notificationId, userId, markRead = true) => {
    try {
        if (markRead) {
            await NotificationRead.updateOne(
                { user_id: userId, notification_id: notificationId },
                { $setOnInsert: { read_at: new Date() } },
                { upsert: true }
            );
        } else {
            await NotificationRead.deleteOne({ user_id: userId, notification_id: notificationId });
        }

        // compute new read count
        const readCount = await NotificationRead.countDocuments({ notification_id: notificationId });
        await Notification.findByIdAndUpdate(notificationId, { read_count: readCount });

        return { notification_id: notificationId, is_read: markRead };
    } catch (error) {
        throw new Error(`Error setting read status: ${error.message}`);
    }
};

/**
 * 84. Delete Notification - Admin only
 */
exports.deleteNotification = async (notificationId, userId, userRole) => {
    try {
        const notification = await Notification.findById(notificationId);
        
        if (!notification) {
            throw new Error('Notification not found');
        }

        // Only admin can hide notifications
        if (userRole !== 'admin') {
            throw new Error('Only admin can hide notifications');
        }

        // Soft hide by setting status to inactive
        const deletedNotification = await Notification.findByIdAndUpdate(
            notificationId,
            { status: 'inactive' },
            { new: true }
        );

        return deletedNotification;
    } catch (error) {
        throw new Error(`Error deleting notification: ${error.message}`);
    }
};

/**
 * 85. Search Notifications - Admin/Staff/Veterinarian/User
 */
exports.searchNotifications = async (searchQuery, filters = {}, userRole = 'user', userId = null) => {
    try {
        const { page = 1, limit = 10 } = filters;
        
        const query = {
            $and: [
                {
                    $or: [
                        { title: { $regex: searchQuery, $options: 'i' } },
                        { content: { $regex: searchQuery, $options: 'i' } }
                    ]
                }
            ]
        };

        // Status filter based on role
        if (userRole === 'admin') {
            // Admin can search all notifications
        } else {
            query.$and.push({ status: 'active' });
            query.$and.push({
                $or: [
                    { target_audience: 'all' },
                    { target_audience: userRole },
                    { target_users: userId }
                ]
            });
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .populate('created_by', 'name email')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            search_query: searchQuery,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    } catch (error) {
        throw new Error(`Error searching notifications: ${error.message}`);
    }
};

/**
 * Send Notification - Admin only
 */
exports.sendNotification = async (notificationId, userId, userRole) => {
    try {
        if (userRole !== 'admin') {
            throw new Error('Only admin can send notifications');
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new Error('Notification not found');
        }

        // Update status to active and set delivery status
        const updatedNotification = await Notification.findByIdAndUpdate(
            notificationId,
            { 
                status: 'active',
                delivery_status: 'sent',
                total_sent: await getTargetUserCount(notification)
            },
            { new: true }
        );

        return updatedNotification;
    } catch (error) {
        throw new Error(`Error sending notification: ${error.message}`);
    }
};

/**
 * Schedule Notification - Admin only
 */
exports.scheduleNotification = async (notificationId, scheduledAt, userId, userRole) => {
    try {
        if (userRole !== 'admin') {
            throw new Error('Only admin can schedule notifications');
        }

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { 
                scheduled_at: new Date(scheduledAt),
                status: 'draft'
            },
            { new: true }
        );

        if (!notification) {
            throw new Error('Notification not found');
        }

        return notification;
    } catch (error) {
        throw new Error(`Error scheduling notification: ${error.message}`);
    }
};

/**
 * Get Notification Stats - Admin only
 */
exports.getNotificationStats = async (userRole) => {
    try {
        if (userRole !== 'admin') {
            throw new Error('Only admin can view notification stats');
        }

        const stats = await Notification.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total_read: { $sum: '$read_count' },
                    total_sent: { $sum: '$total_sent' }
                }
            }
        ]);

        const typeStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            status_stats: stats,
            type_stats: typeStats
        };
    } catch (error) {
        throw new Error(`Error getting notification stats: ${error.message}`);
    }
};

/**
 * Helper function to get target user count
 */
async function getTargetUserCount(notification) {
    try {
        const { target_audience, target_users } = notification;
        
        if (target_audience === 'all') {
            return await User.countDocuments({ status: 'active' });
        } else if (target_audience === 'specific') {
            return target_users ? target_users.length : 0;
        } else {
            return await User.countDocuments({ 
                role: target_audience,
                status: 'active' 
            });
        }
    } catch (error) {
        return 0;
    }
}
