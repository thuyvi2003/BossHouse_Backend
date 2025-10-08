// src/routes/contact.routes.js
const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const protectRoute = require("../middleware/auth.middleware");

// CREATE CONTACT - User
router.post(
  "/",
  protectRoute(["user"]),
  contactController.createContact
);

// VIEW CONTACT LIST - Admin/Staff/User
router.get(
  "/",
  protectRoute(["admin", "staff", "user"]),
  contactController.viewContactList
);

// VIEW CONTACT DETAIL - Admin/Staff/User
router.get(
  "/:id",
  protectRoute(["admin", "staff", "user"]),
  contactController.viewContactDetail
);

// DELETE CONTACT - Admin/Staff
router.delete(
  "/:id",
  protectRoute(["admin", "staff"]),
  contactController.deleteContact
);

// SEARCH CONTACT - Admin/Staff
router.get(
  "/search",
  protectRoute(["admin", "staff"]),
  contactController.searchContact
);

module.exports = router;
