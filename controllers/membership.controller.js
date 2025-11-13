const svc = require('../services/membership.service');

// Create
exports.createMembership = async (req, res) => {
  try {
    const doc = await svc.create({
      name: req.body.name,
      point: req.body.point,
      description: req.body.description,
      is_active: req.body.is_active,
      userId: req.user?._id,
    });
    return res.status(201).json({ message: 'Created', data: doc });
  } catch (err) {
    return res
      .status(err.status || 500)
      .json({ message: err.message || 'Server error' });
  }
};

// List (+search, pagination)
exports.getAllMemberships = async (req, res) => {
  try {
    const result = await svc.list({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Alias search -> reuse list
exports.searchMemberships = async (req, res) => {
  req.query.page = req.query.page ?? 1;
  req.query.limit = req.query.limit ?? 10;
  return exports.getAllMemberships(req, res);
};

// Detail
exports.getMembershipById = async (req, res) => {
  try {
    const item = await svc.getById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ data: item });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update
exports.updateMembership = async (req, res) => {
  try {
    const doc = await svc.update(req.params.id, {
      name: req.body.name,
      point: req.body.point,
      description: req.body.description,
      is_active: req.body.is_active,
      updated_by: req.user?._id,
    });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Updated', data: doc });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Soft delete
exports.deleteMembership = async (req, res) => {
  try {
    const doc = await svc.softDelete(req.params.id, req.user?._id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted (soft)', data: doc });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};