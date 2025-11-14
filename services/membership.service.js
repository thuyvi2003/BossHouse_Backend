const Membership = require('../models/membership.model');

function buildPagination({ page = 1, limit = 10 }) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  return { page: p, limit: l, skip: (p - 1) * l };
}

exports.create = async ({ name, point, description, is_active = true, userId }) => {
  if (!name || description == null || point == null) {
    const err = new Error('name, point, description are required');
    err.status = 400;
    throw err;
  }

  const doc = await Membership.create({
    name,
    point,
    description,
    is_active,
    created_by: userId,
  });
  return doc;
};

exports.list = async ({ page, limit, search }) => {
  const { skip, limit: l, page: p } = buildPagination({ page, limit });

  const filter = {
    is_deleted: false,
    ...(search ? { name: { $regex: String(search).trim(), $options: 'i' } } : {}),
  };

  const [items, total] = await Promise.all([
    Membership.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
    Membership.countDocuments(filter),
  ]);

  return {
    data: items,
    pagination: {
      page: p,
      limit: l,
      totalItems: total,
      totalPages: Math.max(Math.ceil(total / l), 1),
    },
  };
};

exports.getById = async (id) => {
  const item = await Membership.findOne({ _id: id, is_deleted: false });
  return item;
};

exports.update = async (id, payload) => {
  const updates = (({ name, point, description, is_active }) => ({
    ...(name != null ? { name } : {}),
    ...(point != null ? { point } : {}),
    ...(description != null ? { description } : {}),
    ...(is_active != null ? { is_active } : {}),
  }))(payload);

  const doc = await Membership.findOneAndUpdate(
    { _id: id, is_deleted: false },
    updates,
    { new: true }
  );
  return doc;
};

exports.softDelete = async (id, userId) => {
  const doc = await Membership.findOneAndUpdate(
    { _id: id, is_deleted: false },
    { is_deleted: true, updated_by: userId },
    { new: true }
  );
  return doc;
};