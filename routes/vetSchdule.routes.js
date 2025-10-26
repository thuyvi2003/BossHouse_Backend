const express = require("express");
const router = express.Router();
const vetScheduleController = require("../controllers/vetSchedule.controller");
const protectRoute = require("../middleware/auth.middleware");

// === CREATE SCHEDULE ===
router.post("/", protectRoute(["admin", "staff"]), vetScheduleController.createSchedule);

// === VIEW SCHEDULE LIST (with search/filter) ===
router.get("/", protectRoute(["admin", "staff", "user"]), vetScheduleController.getAllSchedules);

// === VIEW SCHEDULE DETAIL ===
router.get("/:id", protectRoute(["admin", "staff", "user"]), vetScheduleController.getScheduleById);

// === UPDATE SCHEDULE ===
router.put("/:id", protectRoute(["admin", "staff"]), vetScheduleController.updateSchedule);

// === DELETE SCHEDULE ===
router.delete("/:id", protectRoute(["admin", "staff"]), vetScheduleController.deleteSchedule);

// === SEARCH SCHEDULES ===
router.get("/search", protectRoute(["admin", "staff", "user"]), vetScheduleController.searchSchedules);

// === FILTER SCHEDULES ===
router.get("/filter", protectRoute(["admin", "staff", "user"]), vetScheduleController.filterSchedules);

// === GET SCHEDULES BY VET ===
router.get("/vet/:vetId", protectRoute(["admin", "staff", "user"]), vetScheduleController.getSchedulesByVet);

// === MARK UNAVAILABLE ===
router.put("/:id/unavailable", protectRoute(["admin", "staff"]), vetScheduleController.markUnavailable);

module.exports = router;
