const express = require("express");
const router = express.Router();
const { auth, roleMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createMessage } = require("../utils/validationSchemas");
const messageController = require("../controllers/messageController");

// Get team chat messages
router.get(
  "/",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  messageController.getAllMessages
);

// Send message in team chat
router.post(
  "/",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  validate(createMessage),
  messageController.sendMessage
);

module.exports = router;
