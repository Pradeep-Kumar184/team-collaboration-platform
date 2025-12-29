const express = require("express");
const router = express.Router();
const { auth, roleMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createProject, updateProject } = require("../utils/validationSchemas");
const projectController = require("../controllers/projectController");

// Get all projects
router.get("/", auth, projectController.getAllProjects);

// Get single project
router.get("/:id", auth, projectController.getProjectById);

// Create project (Admin/Manager only)
router.post(
  "/",
  auth,
  roleMiddleware(["ADMIN", "MANAGER"]),
  validate(createProject),
  projectController.createProject
);

// Update project (Admin/Manager only)
router.put(
  "/:id",
  auth,
  roleMiddleware(["ADMIN", "MANAGER"]),
  validate(updateProject),
  projectController.updateProject
);

// Delete project (Admin only)
router.delete(
  "/:id",
  auth,
  roleMiddleware(["ADMIN"]),
  projectController.deleteProject
);

module.exports = router;
