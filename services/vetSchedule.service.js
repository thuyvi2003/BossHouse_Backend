const VetSchedule = require("../models/vetSchedule.model");

const vetScheduleService = {
  // === CREATE SCHEDULE ===
  createSchedule: async (data) => {
    const schedule = new VetSchedule(data);
    return await schedule.save();
  },

  // === GET ALL (with filter/search) ===
  getAllSchedules: async (query) => {
    const filter = {};

    if (query.vetId) filter.veterinarian_id = query.vetId;
    if (query.isAvailable !== undefined)
      filter.is_available = query.isAvailable === "true";

    // Improved: allow overlapping date range filtering
    if (query.startDate && query.endDate) {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      // Lấy các lịch giao nhau với khoảng thời gian này
      filter.$or = [
        { start_time: { $lte: endDate, $gte: startDate } },
        { end_time: { $gte: startDate, $lte: endDate } },
        {
          $and: [
            { start_time: { $lte: startDate } },
            { end_time: { $gte: endDate } },
          ],
        },
      ];
    }

    return await VetSchedule.find(filter)
      .populate("veterinarian_id", "name specialization")
      .sort({ start_time: 1 });
  },

  // === GET DETAIL ===
  getScheduleById: async (id) => {
    return await VetSchedule.findById(id).populate(
      "veterinarian_id",
      "name specialization"
    );
  },

  // === UPDATE ===
  updateSchedule: async (id, data) => {
    return await VetSchedule.findByIdAndUpdate(id, data, { new: true });
  },

  // === DELETE ===
  deleteSchedule: async (id) => {
    return await VetSchedule.findByIdAndDelete(id);
  },
};

module.exports = vetScheduleService;
