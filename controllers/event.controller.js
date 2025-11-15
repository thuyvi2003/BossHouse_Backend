const eventService = require('../services/event.service');

const getUserId = (req) => req.user ? (req.user._id || req.user.id) : null;
const isAdmin = (req) => req.user?.role?.toLowerCase() === 'admin';
const parseBoolean = (value) => value === 'true' ? true : value === 'false' ? false : undefined;
const parsePagination = (query) => ({
  limit: parseInt(query.limit) || 20,
  skip: parseInt(query.skip) || 0,
});
const buildFilters = (query) => ({
  category: query.category,
  status: query.status,
  start_date: query.start_date,
  end_date: query.end_date,
  is_featured: parseBoolean(query.is_featured),
  ...parsePagination(query),
});

// Admin controllers
exports.createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent({
      ...req.body,
      created_by: req.user?.name || req.user?.email || 'Anonymous',
    });
    res.status(201).json({ status: 'success', message: 'Event created successfully', data: event });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(req.params.id, req.body, getUserId(req));
    res.status(200).json({ status: 'success', message: 'Event updated successfully', data: event });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await eventService.deleteEvent(req.params.id, getUserId(req));
    res.status(200).json({ status: 'success', message: 'Event deleted successfully', data: event });
  } catch (error) {
    next(error);
  }
};

exports.permanentDeleteEvent = async (req, res, next) => {
  try {
    const event = await eventService.permanentDeleteEvent(req.params.id, getUserId(req));
    res.status(200).json({ status: 'success', message: 'Event permanently deleted', data: event });
  } catch (error) {
    next(error);
  }
};

// Public controllers
exports.getAllEvents = async (req, res, next) => {
  try {
    const result = await eventService.getAllEvents(buildFilters(req.query), isAdmin(req) ? 'admin' : 'user');
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id);
    const userId = getUserId(req);
    const isRegistered = userId ? await eventService.checkUserRegistration(req.params.id, userId) : false;
    res.status(200).json({ status: 'success', data: { ...event.toObject(), isRegistered } });
  } catch (error) {
    next(error);
  }
};

exports.searchEvents = async (req, res, next) => {
  try {
    const { q: searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ status: 'error', message: 'Search term is required' });
    }
    const result = await eventService.searchEvents(searchTerm, {
      category: req.query.category,
      status: req.query.status,
      ...parsePagination(req.query),
    });
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

exports.filterEvents = async (req, res, next) => {
  try {
    const result = await eventService.filterEvents(buildFilters(req.query), isAdmin(req) ? 'admin' : 'user');
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// User controllers
exports.registerForEvent = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const registration = await eventService.registerForEvent(req.params.id, userId);
    res.status(201).json({ status: 'success', message: 'Registered for event successfully', data: registration });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message || 'Failed to register for event' });
  }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const registration = await eventService.cancelRegistration(req.params.id, userId);
    res.status(200).json({ status: 'success', message: 'Registration cancelled successfully', data: registration });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message || 'Failed to cancel registration' });
  }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }
    const registrations = await eventService.getUserRegistrations(userId);
    res.status(200).json({ status: 'success', data: registrations });
  } catch (error) {
    next(error);
  }
};
