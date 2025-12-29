const express = require("express");
const router = express.Router();
const { auth, roleMiddleware } = require("../middleware/auth");
const userController = require("../controllers/userController");

// Debug endpoint to check team membership
router.get(
  "/debug-team",
  auth,
  roleMiddleware(["ADMIN"]),
  userController.debugTeamMembership
);

// Get all users in team
router.get(
  "/team",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  userController.getTeamUsers
);

// Update user role (Admin only)
router.put(
  "/:id/role", 
  auth,
  roleMiddleware(["ADMIN"]), 
  userController.updateUserRole
);

module.exports = router;
