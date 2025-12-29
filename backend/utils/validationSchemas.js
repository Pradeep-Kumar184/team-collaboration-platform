const Joi = require("joi");

const schemas = {
  // User validation
  registerUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).required(),
    role: Joi.string().valid("ADMIN", "MANAGER", "MEMBER"),
  }),

  // Project validation
  createProject: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500),
    status: Joi.string().valid("active", "in-progress", "completed", "on-hold"),
  }),

  updateProject: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500),
    status: Joi.string().valid("active", "in-progress", "completed", "on-hold"),
  }),

  // Task validation
  createTask: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).allow(''),
    projectId: Joi.string().required(),
    assignedTo: Joi.string().allow(''),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(1000).allow(''),
    status: Joi.string().valid("todo", "in-progress", "done"),
    assignedTo: Joi.string().allow(''),
  }),

  // Message validation
  createMessage: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
  }),
};

module.exports = schemas;
