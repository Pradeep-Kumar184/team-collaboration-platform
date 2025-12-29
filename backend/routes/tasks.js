const express = require("express");
const router = express.Router();
const { auth, roleMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createTask, updateTask } = require("../utils/validationSchemas");
const taskController = require("../controllers/taskController");

// Get task statistics
router.get(
  "/stats",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  taskController.getTaskStats
);

// Get all tasks with filtering
router.get(
  "/",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  taskController.getAllTasks
);

// Get single task
router.get(
  "/:id",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  taskController.getTaskById
);

// Create task in project
router.post(
  "/",
  auth,
  roleMiddleware(["ADMIN", "MANAGER"]),
  (req, res, next) => {
    console.log('Task creation request body:', req.body);
    console.log('User:', req.dbUser);
    next();
  },
  validate(createTask),
  taskController.createTask
);

// Update task
router.put(
  "/:id",
  auth,
  roleMiddleware(["ADMIN", "MANAGER", "MEMBER"]),
  validate(updateTask),
  taskController.updateTask
);

// Delete task
router.delete(
  "/:id",
  auth,
  roleMiddleware(["ADMIN", "MANAGER"]),
  taskController.deleteTask
);

module.exports = router;
