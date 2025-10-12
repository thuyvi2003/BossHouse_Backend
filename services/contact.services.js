// services/contactService.js
const Contact = require("../models/contact.model");

const contactService = {
  // === CREATE CONTACT ===
  createContact: async (data) => {
    const contact = new Contact(data);
    return await contact.save();
  },

  // === GET ALL CONTACTS ===
  getAllContacts: async (filter = {}) => {
    return await Contact.find(filter)
      .populate("createdBy", "name email role")
      .populate("responses.createdBy", "name email role")
      .sort({ createdAt: -1 }) // 🔹 Sắp xếp mới nhất lên đầu
      .lean();
  },

  // === GET CONTACT BY ID ===
  getContactById: async (id) => {
    return await Contact.findById(id)
      .populate("createdBy", "name email role")
      .populate("responses.createdBy", "name email role");
  },

  // === UPDATE CONTACT ===
  updateContact: async (id, data) => {
    return await Contact.findByIdAndUpdate(id, data, { new: true });
  },

  // === DELETE CONTACT ===
  deleteContact: async (id) => {
    return await Contact.findByIdAndDelete(id);
  },

  // === REPLY CONTACT ===
  replyContact: async (contactId, replyData) => {
    const contact = await Contact.findById(contactId);
    if (!contact) throw new Error("Contact not found");

    contact.responses = contact.responses || [];
    contact.responses.push(replyData);

    return await contact.save();
  },

  // === SEARCH CONTACT ===
  searchContacts: async (query) => {
    if (!query) return [];
    const regex = new RegExp(query, "i");
    return await Contact.find({
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex },
        { message: regex },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 }) // 🔹 Sắp xếp theo thời gian mới nhất
      .lean();
  },
};

module.exports = contactService;
