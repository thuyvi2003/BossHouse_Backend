const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { getIO } = require('./socket');
const NotificationRead = require('../models/notificationRead.model');

// Helper functions
const buildQuery = (filters, userRole, userId, isHomepage = false) => {
    const { type, priority, status, search, read_status, page = 1, limit = 10, sort = '-created_at' } = filters;
    const query = {};
    const andConditions = [];
    if (type) query.type = type;
    if (priority) query.priority = priority;
    query.status = isHomepage || userRole !== 'admin' ? 'active' : (status || null);
    if (query.status === null) delete query.status;
    if (search) {
        andConditions.push({
            $or: [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }]
        });
    }
    if (userRole === 'admin' && !isHomepage) {
        andConditions.push({ $or: [{ target_audience: 'all' }, { target_audience: 'admin' }] });
    } else {
        andConditions.push({
            $or: [{ target_audience: 'all' }, { target_audience: userRole }, { target_users: userId }]
        });
    }
    if (andConditions.length > 0) query.$and = andConditions;
    return { query, page: parseInt(page), limit: parseInt(limit), sort, read_status };
};

const attachReadStatus = async (notifications, userId, read_status) => {
    if (!userId || !notifications.length) return notifications.map(n => ({ ...n, is_read: false }));
    try {
        const ids = notifications.map(n => n._id);
        const readDocs = await NotificationRead.find({ user_id: userId, notification_id: { $in: ids } }, 'notification_id');
        const readSet = new Set(readDocs.map(d => String(d.notification_id)));
        let notificationsWithRead = notifications.map(n => ({ ...n, is_read: readSet.has(String(n._id)) }));
        if (read_status === 'read') notificationsWithRead = notificationsWithRead.filter(n => n.is_read);
        if (read_status === 'unread') notificationsWithRead = notificationsWithRead.filter(n => !n.is_read);
        return notificationsWithRead;
    } catch (error) {
        return notifications.map(n => ({ ...n, is_read: false }));
    }
};

const buildPagination = (page, limit, totalItems) => ({
    current_page: parseInt(page),
    total_pages: Math.ceil(totalItems / limit),
    total_items: totalItems,
    items_per_page: parseInt(limit)
});

const emitSocketNotification = (notification) => {
    try {
        const io = getIO();
        const payload = {
            _id: notification._id, title: notification.title, content: notification.content,
            status: notification.status, target_audience: notification.target_audience,
            target_users: notification.target_users, created_at: notification.created_at,
            type: notification.type, priority: notification.priority
        };
        if (notification.target_audience === 'specific' && Array.isArray(notification.target_users)) {
            // Gửi đến từng user cụ thể trong room của họ
            notification.target_users.forEach(uid => io.to(String(uid)).emit('notification:new', payload));
        } else if (notification.target_audience === 'all') {
            // Gửi đến tất cả user
            io.emit('notification:new', payload);
        } else {
            // Gửi đến tất cả user có role tương ứng (sẽ filter ở frontend)
            io.emit('notification:new', payload);
        }
    } catch (e) { /* socket not initialized */ }
};

const validateAdminRole = (userRole, action = 'perform this action') => {
    if (userRole !== 'admin') throw new Error(`Only admin can ${action}`);
};

const getTargetUserCount = async (notification) => {
    try {
        const { target_audience, target_users } = notification;
        if (target_audience === 'all') return await User.countDocuments({ status: 'active' });
        if (target_audience === 'specific') return target_users?.length || 0;
        return await User.countDocuments({ role: target_audience, status: 'active' });
    } catch (error) {
        return 0;
    }
};

// Main functions
exports.createNotification = async (notificationData, userId, userRole) => {
    if (!notificationData.title || !notificationData.content) throw new Error('Title and content are required');
    const notification = new Notification({
        ...notificationData, created_by: userId, created_by_role: userRole, status: 'active'
    });
    await notification.save();
    await notification.populate('created_by', 'name email');
    emitSocketNotification(notification);
    return notification;
};

exports.getAllNotifications = async (filters = {}, userRole = 'user', userId = null) => {
    const { query, page, limit, sort, read_status } = buildQuery(filters, userRole, userId, false);
    const sortObj = sort.startsWith('-') ? { [sort.substring(1)]: -1 } : { [sort]: 1 };
    const skip = (page - 1) * limit;
    const [allNotifications] = await Promise.all([
        Notification.find(query).populate('created_by', 'name email').sort(sortObj).lean(),
        Notification.countDocuments(query)
    ]);
    const notificationsWithRead = await attachReadStatus(allNotifications, userId, read_status);
    const notifications = notificationsWithRead.slice(skip, skip + limit);
    return { notifications, pagination: buildPagination(page, limit, notificationsWithRead.length) };
};

exports.getHomepageNotifications = async (filters = {}, userRole = 'user', userId = null) => {
    const { query, page, limit, sort, read_status } = buildQuery(filters, userRole, userId, true);
    const sortObj = sort.startsWith('-') ? { [sort.substring(1)]: -1 } : { [sort]: 1 };
    const skip = (page - 1) * limit;
    const [allNotifications, total] = await Promise.all([
        Notification.find(query).populate('created_by', 'name email username').sort(sortObj).skip(skip).limit(limit),
        Notification.countDocuments(query)
    ]);
    const notificationsWithRead = await attachReadStatus(allNotifications, userId, read_status);
    return { notifications: notificationsWithRead, pagination: buildPagination(page, limit, total) };
};

exports.getNotificationById = async (notificationId, userRole = 'user', userId = null) => {
    const query = { _id: notificationId };
    if (userRole !== 'admin') {
        query.status = 'active';
        query.$or = [{ target_audience: 'all' }, { target_audience: userRole }, { target_users: userId }];
    }
    const notification = await Notification.findOne(query).populate('created_by', 'name email');
    if (!notification) throw new Error('Notification not found or not accessible');
    if (userId) {
        const read = await NotificationRead.findOne({ user_id: userId, notification_id: notificationId });
        const obj = notification.toObject();
        obj.is_read = !!read;
        return obj;
    }
    return notification;
};

exports.updateNotification = async (notificationId, updateData, userId, userRole) => {
    validateAdminRole(userRole, 'edit notifications');
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    const allowedFields = ['title', 'content', 'type', 'priority', 'target_audience', 'target_users',
        'status', 'scheduled_at', 'expires_at', 'image_url', 'action_url', 'action_text', 'related_type', 'related_id'];
    const updateFields = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) updateFields[field] = updateData[field];
    });
    return await Notification.findByIdAndUpdate(notificationId, updateFields, { new: true, runValidators: true })
        .populate('created_by', 'name email');
};

exports.setReadStatus = async (notificationId, userId, markRead = true) => {
    if (markRead) {
        await NotificationRead.updateOne(
            { user_id: userId, notification_id: notificationId },
            { $setOnInsert: { read_at: new Date() } },
            { upsert: true }
        );
    } else {
        await NotificationRead.deleteOne({ user_id: userId, notification_id: notificationId });
    }
    const readCount = await NotificationRead.countDocuments({ notification_id: notificationId });
    await Notification.findByIdAndUpdate(notificationId, { read_count: readCount });
    
    // Emit Socket.IO event để frontend cập nhật real-time
    try {
        const io = getIO();
        io.to(String(userId)).emit('notification:read', { notification_id: notificationId, is_read: markRead });
    } catch (e) { /* socket not initialized */ }
    
    return { notification_id: notificationId, is_read: markRead };
};

exports.deleteNotification = async (notificationId, userId, userRole) => {
    validateAdminRole(userRole, 'hide notifications');
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    return await Notification.findByIdAndUpdate(notificationId, { status: 'inactive' }, { new: true });
};

exports.searchNotifications = async (searchQuery, filters = {}, userRole = 'user', userId = null) => {
    const { page = 1, limit = 10 } = filters;
    const query = {
        $and: [{ $or: [{ title: { $regex: searchQuery, $options: 'i' } }, { content: { $regex: searchQuery, $options: 'i' } }] }]
    };
    if (userRole === 'admin') {
        query.$and.push({ $or: [{ target_audience: 'all' }, { target_audience: 'admin' }] });
    } else {
        query.$and.push({ status: 'active' });
        query.$and.push({ $or: [{ target_audience: 'all' }, { target_audience: userRole }, { target_users: userId }] });
    }
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
        Notification.find(query).populate('created_by', 'name email').sort({ created_at: -1 }).skip(skip).limit(parseInt(limit)),
        Notification.countDocuments(query)
    ]);
    return { notifications, search_query: searchQuery, pagination: buildPagination(page, limit, total) };
};

exports.sendNotification = async (notificationId, userId, userRole) => {
    validateAdminRole(userRole, 'send notifications');
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    return await Notification.findByIdAndUpdate(
        notificationId,
        { status: 'active', delivery_status: 'sent', total_sent: await getTargetUserCount(notification) },
        { new: true }
    );
};

exports.scheduleNotification = async (notificationId, scheduledAt, userId, userRole) => {
    validateAdminRole(userRole, 'schedule notifications');
    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { scheduled_at: new Date(scheduledAt), status: 'draft' },
        { new: true }
    );
    if (!notification) throw new Error('Notification not found');
    return notification;
};

exports.getNotificationStats = async (userRole) => {
    validateAdminRole(userRole, 'view notification stats');
    const [stats, typeStats] = await Promise.all([
        Notification.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total_read: { $sum: '$read_count' }, total_sent: { $sum: '$total_sent' } } }]),
        Notification.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }])
    ]);
    return { status_stats: stats, type_stats: typeStats };
};
