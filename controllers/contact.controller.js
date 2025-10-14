// controllers/contact.controller.js
const Contact = require("../models/contact.model");
const contactService = require("../services/contact.services");

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
];

// === Helper: map files to attachments ===
const mapFilesToAttachments = (files) => {
  if (!files) return [];
  return files
    .filter((f) => ALLOWED_IMAGE_TYPES.includes(f.mimetype))
    .map((f) => ({
      data: f.buffer,
      contentType: f.mimetype,
      name: f.originalname,
    }));
};

const contactController = {
  // === CREATE CONTACT ===
  createContact: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { name, email, phone, type, message } = req.body;
      if (!name?.trim() || !message?.trim())
        return res
          .status(400)
          .json({ message: "Name and message are required" });

      const data = {
        name: name.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        type: type || "Support",
        message: message.trim(),
        createdBy: req.user._id,
        attachments: mapFilesToAttachments(req.files),
      };

      const contact = await contactService.createContact(data);
      res.status(201).json({ data: contact });
    } catch (err) {
      console.error("createContact error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // === VIEW CONTACT LIST ===
  viewContactList: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      let contacts;
      if (req.user.role === "user") {
        contacts = await contactService.getAllContacts({ createdBy: req.user._id });
      } else {
        contacts = await contactService.getAllContacts();
      }

      const formatted = contacts.map((c) => {
        const responses = (c.responses || []).map((r, idx) => ({
          ...r,
          attachmentsUrls:
            r.attachments?.map(
              (a, aIdx) =>
                `/api/contacts/${c._id}/reply/${idx}/attachment/${aIdx}`
            ) || [],
        }));
        return {
          ...c,
          attachmentsUrls:
            c.attachments?.map(
              (a, idx) => `/api/contacts/${c._id}/attachment/${idx}`
            ) || [],
          responses,
        };
      });

      res.status(200).json({ data: formatted });
    } catch (err) {
      console.error("viewContactList error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // === VIEW CONTACT DETAIL ===
  viewContactDetail: async (req, res) => {
    try {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact)
        return res.status(404).json({ message: "Contact not found" });

      const contactCreatorId = contact.createdBy._id || contact.createdBy;
      if (
        req.user.role === "user" &&
        contactCreatorId.toString() !== req.user._id.toString()
      )
        return res.status(403).json({ message: "Forbidden" });

      const cObj = contact.toObject();
      cObj.attachmentsUrls =
        cObj.attachments?.map(
          (a, idx) => `/api/contacts/${cObj._id}/attachment/${idx}`
        ) || [];
      cObj.responses = (cObj.responses || []).map((r, idx) => ({
        ...r,
        attachmentsUrls:
          r.attachments?.map(
            (a, aIdx) =>
              `/api/contacts/${cObj._id}/reply/${idx}/attachment/${aIdx}`
          ) || [],
      }));

      res.status(200).json({ data: cObj });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // === GET ATTACHMENT OF MAIN CONTACT ===
  getAttachment: async (req, res) => {
    try {
      const { id, index } = req.params;
      const contact = await Contact.findById(id);
      if (!contact || !contact.attachments?.length)
        return res.status(404).send("Not found");

      const idx = parseInt(index);
      if (idx < 0 || idx >= contact.attachments.length)
        return res.status(404).send("Invalid index");

      const attachment = contact.attachments[idx];
      res.set("Content-Type", attachment.contentType);
      res.send(attachment.data);
    } catch (err) {
      res.status(500).send(err.message);
    }
  },

  // === GET ATTACHMENT OF REPLY ===
  getReplyAttachment: async (req, res) => {
    try {
      const { contactId, replyIndex, attachmentIndex } = req.params;
      const contact = await Contact.findById(contactId);
      const rIdx = parseInt(replyIndex);
      const aIdx = parseInt(attachmentIndex);

      if (
        !contact ||
        !contact.responses[rIdx] ||
        !contact.responses[rIdx].attachments?.length ||
        aIdx < 0 ||
        aIdx >= contact.responses[rIdx].attachments.length
      )
        return res.status(404).send("Not found");

      const attachment = contact.responses[rIdx].attachments[aIdx];
      res.set("Content-Type", attachment.contentType);
      res.send(attachment.data);
    } catch (err) {
      res.status(500).send(err.message);
    }
  },

  // === REPLY CONTACT ===
  replyContact: async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const contact = await contactService.getContactById(req.params.id);
      if (!contact)
        return res.status(404).json({ message: "Contact not found" });

      if (
        req.user.role === "user" &&
        contact.createdBy._id.toString() !== req.user._id.toString()
      )
        return res.status(403).json({ message: "Forbidden" });

      const { message } = req.body;

      if ((!message || !message.trim()) && (!req.files || req.files.length === 0)) {
        return res
          .status(400)
          .json({ message: "Reply message or attachment is required" });
      }

      const replyData = {
        message: message?.trim() || "",
        createdBy: req.user._id,
        createdAt: new Date(),
        attachments: mapFilesToAttachments(req.files),
      };

      const updated = await contactService.replyContact(req.params.id, replyData);
      res.status(200).json({ data: updated });
    } catch (err) {
      console.error("replyContact error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // === UPDATE CONTACT ===
  updateContact: async (req, res) => {
    try {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact)
        return res.status(404).json({ message: "Contact not found" });

      const contactCreatorId = contact.createdBy._id || contact.createdBy;
      if (
        req.user.role === "user" &&
        contactCreatorId.toString() !== req.user._id.toString()
      )
        return res.status(403).json({ message: "Forbidden" });

      let attachments = contact.attachments || [];

      if (req.body.removeAttachments === "true") attachments = [];

      if (req.files?.length) {
        attachments = attachments.concat(mapFilesToAttachments(req.files));
      }

      const data = { ...req.body, attachments };

      const updated = await contactService.updateContact(req.params.id, data);
      res.status(200).json({ data: updated });
    } catch (err) {
      console.error("updateContact error:", err);
      res.status(500).json({ message: err.message });
    }
  },

  // === DELETE CONTACT ===
  deleteContact: async (req, res) => {
    try {
      const contact = await contactService.getContactById(req.params.id);
      if (!contact)
        return res.status(404).json({ message: "Contact not found" });

      if (req.user.role === "user")
        return res.status(403).json({ message: "Forbidden" });

      await contactService.deleteContact(req.params.id);
      res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // === SEARCH CONTACT ===
  searchContact: async (req, res) => {
    try {
      const { q } = req.query;
      const contacts = await contactService.searchContacts(q);
      res.status(200).json({ data: contacts });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // === FILTER CONTACT ===
  filterContact: async (req, res) => {
    try {
      const { status } = req.query;
      const contacts = await Contact.find(status ? { status } : {}).lean();
      res.status(200).json({ data: contacts });
    } catch (error) {
      console.error("Error filtering contacts:", error);
      res.status(500).json({ message: "Failed to filter contacts" });
    }
  },
};

module.exports = contactController;
