const VetSchedule = require("../models/vetSchedule.model");

// --- CREATE ---
exports.createSchedule = async (req, res) => {
  try {
    const schedule = await VetSchedule.create(req.body);
    const populatedSchedule = await schedule.populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });
    res.status(201).json({ success: true, data: populatedSchedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GET ALL ---
exports.getAllSchedules = async (req, res) => {
  try {
    const filters = {};

    // Optional query filters
    if (req.query.vet) filters.veterinarian_id = req.query.vet;
    if (req.query.status) {
      filters.is_available = req.query.status === "AVAILABLE";
    }

    const schedules = await VetSchedule.find(filters)
      .populate({
        path: "veterinarian_id",
        populate: { path: "user_id", select: "name" },
      })
      .sort({ start_time: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GET BY ID ---
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await VetSchedule.findById(req.params.id).populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });

    if (!schedule) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- UPDATE ---
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await VetSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate({
        path: "veterinarian_id",
        populate: { path: "user_id", select: "name" },
      });

    if (!schedule) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- DELETE ---
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await VetSchedule.findByIdAndDelete(req.params.id);
    if (!schedule) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- SEARCH ---
exports.searchSchedules = async (req, res) => {
  try {
    const q = req.query.q || "";
    const schedules = await VetSchedule.find({
      // ví dụ search theo note
      note: { $regex: q, $options: "i" },
    }).populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- FILTER ---
exports.filterSchedules = async (req, res) => {
  try {
    const filters = {};
    if (req.query.vet) filters.veterinarian_id = req.query.vet;
    if (req.query.status) filters.is_available = req.query.status === "AVAILABLE";

    const schedules = await VetSchedule.find(filters).populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GET BY VET ---
exports.getSchedulesByVet = async (req, res) => {
  try {
    const schedules = await VetSchedule.find({ veterinarian_id: req.params.vetId }).populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- MARK UNAVAILABLE ---
exports.markUnavailable = async (req, res) => {
  try {
    const schedule = await VetSchedule.findByIdAndUpdate(
      req.params.id,
      { is_available: false },
      { new: true }
    ).populate({
      path: "veterinarian_id",
      populate: { path: "user_id", select: "name" },
    });

    if (!schedule) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GET MY SCHEDULES (for logged-in vet) ---
exports.getMySchedules = async (req, res) => {
  try {
    // 🔒 Đảm bảo chỉ vet mới được truy cập
    if (req.user.role !== "veterinarian") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only veterinarians can view their schedules",
      });
    }

    // 🔍 Tìm tất cả lịch có veterinarian_id là của user hiện tại
    const schedules = await VetSchedule.find({ veterinarian_id: req.user._id })
      .populate({
        path: "veterinarian_id",
        populate: { path: "user_id", select: "name" },
      })
      .sort({ start_time: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
