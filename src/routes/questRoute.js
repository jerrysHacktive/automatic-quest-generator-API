const express = require("express");
const router = express.Router();
const {
  searchLocation,
  createQuestFromLocation,
} = require("../controller/questController");

router.post("/search", searchLocation);
router.post("/create", createQuestFromLocation);

module.exports = router;
