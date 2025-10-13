const mongoose = require("mongoose");

// === Attachment schema ===
const attachmentSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String,
  name: String,
});

// === Response (reply) schema ===
const responseSchema = new mongoose.Schema({
  message: { type: String, required: true },
  attachments: [attachmentSchema], // multiple attachments per reply
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

// === Contact schema ===
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    type: {
      type: String,
      enum: ["Support", "Feedback", "Complaint"],
      default: "Support",
    },
    message: { type: String, required: true },
    attachments: [attachmentSchema], // multiple attachments for main message
    responses: [responseSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Pending", "Complete"], default: "Pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
