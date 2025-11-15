const Event = require('../models/event.model');
const EventRegistration = require('../models/eventRegistration.model');
const notificationService = require('./notification.service');
const { deleteFromCloudinary } = require('./cloudinary.services');

// Helper functions
const validateEventDates = (startDate, endDate, currentStatus = null) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if ((!currentStatus || currentStatus === 'UPCOMING') && start < now) {
    throw new Error('Start date cannot be in the past');
  }
  if (end <= start) {
    throw new Error('End date must be after start date');
  }
};

const buildEventQuery = (filters, role) => {
  const query = {};
  
  // Status filter - apply for both admin and user if provided
  if (filters.status) {
    query.status = filters.status;
  } else if (role !== 'admin') {
    // Default: user only sees UPCOMING and ONGOING events
    query.status = { $in: ['UPCOMING', 'ONGOING'] };
  }
  
  // Common filters
  if (filters.category) query.category = filters.category;
  if (filters.is_featured !== undefined) query.is_featured = filters.is_featured;
  if (role === 'admin' && filters.created_by) query.created_by = filters.created_by;
  
  // Date range filter
  if (filters.start_date || filters.end_date) {
    query.start_date = {};
    if (filters.start_date) query.start_date.$gte = new Date(filters.start_date);
    if (filters.end_date) query.start_date.$lte = new Date(filters.end_date);
  }
  
  return query;
};

const buildSearchQuery = (searchTerm, filters) => {
  const query = {
    status: filters.status || { $in: ['UPCOMING', 'ONGOING'] },
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { location: { $regex: searchTerm, $options: 'i' } },
      { category: { $regex: searchTerm, $options: 'i' } },
    ],
  };
  if (filters.category) query.category = filters.category;
  return query;
};

const updateEventStatus = async (event) => {
  if (event.status === 'CANCELLED') return event;

  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  if (now > endDate && event.status !== 'COMPLETED') {
    event.status = 'COMPLETED';
    await event.save();
  } else if (now >= startDate && now <= endDate && event.status === 'UPCOMING') {
    event.status = 'ONGOING';
    await event.save();
  }
  return event;
};

const updateMultipleEventStatuses = async (events) => {
  await Promise.all(events.map(updateEventStatus));
};

const getRegisteredUserIds = async (eventId) => {
  const registrations = await EventRegistration.find({
    event_id: eventId,
    status: 'REGISTERED',
  }).select('user_id');
  return registrations.map((reg) => reg.user_id);
};

const notifyRegisteredUsers = async (event, notificationData, adminUserId) => {
  try {
    const eventId = event._id || event;
    const userIds = await getRegisteredUserIds(eventId);
    if (userIds.length === 0) return;

    await notificationService.createNotification(
      {
        ...notificationData,
        target_audience: 'specific',
        target_users: userIds,
        related_type: 'event',
        related_id: eventId,
        action_url: `/events/${eventId}`,
        action_text: 'View Event',
      },
      adminUserId,
      'admin'
    );
  } catch (error) {
    console.error('Error notifying registered users:', error);
  }
};

const detectChangedFields = (existingEvent, updateData) => {
  const changedFields = [];
  const fields = ['start_date', 'end_date', 'location', 'title'];
  
  fields.forEach(field => {
    if (updateData[field]) {
      const existing = existingEvent[field];
      const updated = updateData[field];
      
      if (field.includes('date')) {
        if (new Date(updated).getTime() !== new Date(existing).getTime()) {
          changedFields.push(field.replace('_', ' '));
        }
      } else if (updated.trim() !== existing.trim()) {
        changedFields.push(field);
      }
    }
  });
  
  return changedFields;
};

const queryEvents = async (query, filters, role, sortBy = { is_featured: -1, start_date: 1, created_at: -1 }) => {
  const limit = filters.limit || (role === 'admin' ? 50 : 20);
  const skip = filters.skip || 0;

  const events = await Event.find(query)
    .sort(sortBy)
    .limit(limit)
    .skip(skip);

  await updateMultipleEventStatuses(events);
  const total = await Event.countDocuments(query);
  
  return {
    events,
    total,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
  };
};

// Main exports
exports.updateEventStatus = updateEventStatus;

exports.createEvent = async (eventData) => {
  validateEventDates(eventData.start_date, eventData.end_date);
  return await Event.create(eventData);
};

exports.getEventById = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');
  await updateEventStatus(event);
  return event;
};

exports.getAllEvents = async (filters = {}, role = 'user') => {
  const query = buildEventQuery(filters, role);
  return await queryEvents(query, filters, role);
};

exports.filterEvents = exports.getAllEvents; // Same logic

exports.searchEvents = async (searchTerm, filters = {}) => {
  const query = buildSearchQuery(searchTerm, filters);
  const result = await queryEvents(query, filters, 'user', { start_date: 1, created_at: -1 });
  result.searchTerm = searchTerm;
  return result;
};

exports.updateEvent = async (eventId, updateData, adminUserId = null) => {
  const existingEvent = await Event.findById(eventId);
  if (!existingEvent) throw new Error('Event not found');

  if (updateData.start_date || updateData.end_date) {
    validateEventDates(
      updateData.start_date || existingEvent.start_date,
      updateData.end_date || existingEvent.end_date,
      existingEvent.status
    );
  }

  // Delete old image from Cloudinary if new image is provided
  if (updateData.image && existingEvent.image?.includes('cloudinary.com')) {
    try {
      await deleteFromCloudinary(existingEvent.image);
    } catch (error) {
      console.error('Error deleting old image from Cloudinary:', error);
    }
  }

  const event = await Event.findByIdAndUpdate(eventId, updateData, { new: true, runValidators: true });

  // Notify users if important fields changed
  if (adminUserId) {
    const changedFields = detectChangedFields(existingEvent, updateData);
    const importantFields = ['start_date', 'end_date', 'location', 'title'];
    const hasImportantChanges = importantFields.some((field) => updateData[field]);

    if (hasImportantChanges && changedFields.length > 0) {
      await notifyRegisteredUsers(
        event,
        {
          title: `Event Updated: ${event.title}`,
          content: `The event "${event.title}" has been updated. Changes: ${changedFields.join(', ')}. Please check the event details.`,
          type: 'warning',
          priority: 'high',
          image_url: event.image || undefined,
        },
        adminUserId
      );
    }
  }
  
  return event;
};

const createCancellationNotification = (event) => ({
  title: `Event Cancelled: ${event.title}`,
  content: `The event "${event.title}" scheduled for ${new Date(event.start_date).toLocaleDateString()} has been cancelled. We apologize for any inconvenience.`,
  type: 'error',
  priority: 'urgent',
  image_url: event.image || undefined,
});

exports.deleteEvent = async (eventId, adminUserId = null) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  if (adminUserId) {
    await notifyRegisteredUsers(event, createCancellationNotification(event), adminUserId);
  }

  event.status = 'CANCELLED';
  await event.save();
  return event;
};

exports.permanentDeleteEvent = async (eventId, adminUserId = null) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  if (adminUserId) {
    await notifyRegisteredUsers(event, createCancellationNotification(event), adminUserId);
  }

  // Delete image from Cloudinary if exists
  if (event.image?.includes('cloudinary.com')) {
    try {
      await deleteFromCloudinary(event.image);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }

  await EventRegistration.deleteMany({ event_id: eventId });
  await Event.findByIdAndDelete(eventId);
  return event;
};

exports.registerForEvent = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Event not found');

  await updateEventStatus(event);

  if (!['UPCOMING', 'ONGOING'].includes(event.status)) {
    throw new Error('Event is not available for registration');
  }
  if (new Date() > new Date(event.end_date)) {
    throw new Error('Event has already ended');
  }

  // Check existing registration
  const existingRegistration = await EventRegistration.findOne({
    event_id: eventId,
    user_id: userId,
  });

  if (existingRegistration?.status === 'REGISTERED') {
    throw new Error('User already registered for this event');
  }

  // Check capacity
  if (event.current_participants >= event.max_participants) {
    throw new Error('Event is full');
  }

  // Reactivate cancelled registration or create new one
  if (existingRegistration?.status === 'CANCELLED') {
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { current_participants: 1 } },
      { new: true }
    );
    
    if (updatedEvent.current_participants > updatedEvent.max_participants) {
      await Event.findByIdAndUpdate(eventId, { $inc: { current_participants: -1 } });
      throw new Error('Event is full');
    }
    
    existingRegistration.status = 'REGISTERED';
    existingRegistration.registration_date = new Date();
    await existingRegistration.save();
    return existingRegistration;
  }

  // Create new registration
  const registration = await EventRegistration.create({
    event_id: eventId,
    user_id: userId,
    status: 'REGISTERED',
  });

  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    { $inc: { current_participants: 1 } },
    { new: true }
  );

  // Double-check capacity after increment
  if (updatedEvent.current_participants > updatedEvent.max_participants) {
    registration.status = 'CANCELLED';
    await registration.save();
    await Event.findByIdAndUpdate(eventId, { $inc: { current_participants: -1 } });
    throw new Error('Event is full');
  }

  return registration;
};

exports.cancelRegistration = async (eventId, userId) => {
  const registration = await EventRegistration.findOne({
    event_id: eventId,
    user_id: userId,
    status: 'REGISTERED',
  });
  
  if (!registration) throw new Error('Registration not found');

  registration.status = 'CANCELLED';
  await registration.save();

  // Ensure current_participants doesn't go below 0
  const event = await Event.findById(eventId);
  if (event?.current_participants > 0) {
    await Event.findByIdAndUpdate(eventId, { $inc: { current_participants: -1 } });
  }

  return registration;
};

exports.checkUserRegistration = async (eventId, userId) => {
  const registration = await EventRegistration.findOne({
    event_id: eventId,
    user_id: userId,
    status: 'REGISTERED',
  });
  return !!registration;
};

exports.getUserRegistrations = async (userId) => {
  const registrations = await EventRegistration.find({ user_id: userId })
    .populate('event_id')
    .sort({ registration_date: -1 });

  const events = registrations.map((reg) => reg.event_id).filter(Boolean);
  await updateMultipleEventStatuses(events);
  return registrations;
};
