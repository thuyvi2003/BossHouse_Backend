const express = require("express");
const router = express.Router();
const vetController = require("../controllers/vet.controller");

router.get("/", vetController.getAllVeterinarians);

module.exports = router;
