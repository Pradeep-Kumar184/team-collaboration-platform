const express = require("express");
const router = express.Router();
const invitationController = require("../controllers/invitationController");
const { auth, roleMiddleware } = require("../middleware/auth");

// Public route - validate invitation code
router.get("/validate/:code", invitationController.validateInvitation);

// Protected routes
router.use(auth);

// Use invitation code (for new users joining)
router.post("/use", invitationController.useInvitation);

// Admin/Manager only routes
router.use(roleMiddleware(["ADMIN", "MANAGER"]));

// Create invitation
router.post("/", invitationController.createInvitation);

// Get team invitations
router.get("/", invitationController.getTeamInvitations);

// Delete invitation
router.delete("/:id", invitationController.deleteInvitation);

module.exports = router;