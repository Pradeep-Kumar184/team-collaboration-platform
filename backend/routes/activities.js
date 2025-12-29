const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { auth } = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// Get team activities
router.get("/team", activityController.getTeamActivities);

// Get user activities
router.get("/user", activityController.getUserActivities);

module.exports = router;