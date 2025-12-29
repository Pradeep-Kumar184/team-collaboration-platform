const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { registerUser } = require("../utils/validationSchemas");
const authController = require("../controllers/authController");

// Register/Login user (called after Firebase auth)
router.post("/register", validate(registerUser), authController.register);

// Get current user info
router.get("/login", auth, authController.getMe);

module.exports = router;
