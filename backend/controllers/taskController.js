const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");
const ActivityService = require("../services/activityService");

const taskController = {
  // Get all tasks with basic filtering
  getAllTasks: async (req, res) => {
    try {
      const { 
        projectId, 
        status, 
        assignedTo, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      const filter = {};

      if (projectId) {
        // Check if project belongs to user's team
        const project = await Project.findOne({
          _id: projectId,
          teamId: req.dbUser.teamId,
        });

        if (!project) {
          return res.status(404).json({
            success: false,
            error: "Project not found",
          });
        }

        filter.projectId = projectId;
      } else {
        // Get tasks from all projects in user's team
        const projects = await Project.find({ teamId: req.dbUser.teamId });
        const projectIds = projects.map((p) => p._id);
        filter.projectId = { $in: projectIds };
      }

      // Apply filters
      if (status) filter.status = status;
      if (assignedTo) filter.assignedTo = assignedTo;
      
      // Search in title and description
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // If member, only show assigned tasks
      if (req.dbUser.role === "MEMBER") {
        filter.assignedTo = req.dbUser._id;
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const tasks = await Task.find(filter)
        .populate("projectId", "name status")
        .populate("assignedTo", "name email")
        .sort(sortOptions);

      res.json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  // Get single task
  getTaskById: async (req, res) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate("projectId", "name status")
        .populate("assignedTo", "name email");

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      // Check if task's project belongs to user's team
      const project = await Project.findOne({
        _id: task.projectId._id,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      res.json({
        success: true,
        data: task,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  // Create task in project
  createTask: async (req, res) => {
    try {
      const { projectId } = req.body;

      console.log('Creating task with data:', req.body);

      // Check if project exists and belongs to user's team
      const project = await Project.findOne({
        _id: projectId,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: "Project not found or access denied",
        });
      }

      // Validate assignedTo user exists in team if provided
      if (req.body.assignedTo) {
        const assignedUser = await User.findOne({
          _id: req.body.assignedTo,
          teamId: req.dbUser.teamId,
        });

        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            error: "Assigned user not found in team",
          });
        }
      }

      // Clean the data before creating task
      const taskData = {
        title: req.body.title,
        description: req.body.description || '',
        status: req.body.status || 'todo',
        projectId: req.body.projectId,
      };

      // Add optional fields only if they exist
      if (req.body.assignedTo) taskData.assignedTo = req.body.assignedTo;

      console.log('Cleaned task data:', taskData);

      const task = new Task(taskData);
      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate("projectId", "name status")
        .populate("assignedTo", "name email");

      // Log activity
      await ActivityService.logActivity(
        'task_created',
        `${req.dbUser.name} created task "${populatedTask.title}"`,
        req.dbUser._id,
        req.dbUser.teamId,
        populatedTask._id,
        'task',
        { projectName: populatedTask.projectId.name }
      );

      res.status(201).json({
        success: true,
        data: populatedTask,
      });
    } catch (error) {
      console.error('Task creation error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to create task",
        details: error.message
      });
    }
  },

  // Update task
  updateTask: async (req, res) => {
    try {
      let task = await Task.findById(req.params.id).populate("projectId");

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      // Check if task's project belongs to user's team
      const project = await Project.findOne({
        _id: task.projectId._id,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      // Members can only update their own tasks' status
      if (req.dbUser.role === "MEMBER") {
        const isAssigned = task.assignedTo && task.assignedTo.toString() === req.dbUser._id.toString();
        
        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            error: "You can only update tasks assigned to you",
          });
        }

        // Members can only update status
        const allowedUpdates = ["status"];
        const updates = Object.keys(req.body);
        const isValidUpdate = updates.every((update) =>
          allowedUpdates.includes(update)
        );

        if (!isValidUpdate) {
          return res.status(403).json({
            success: false,
            error: "You can only update task status",
          });
        }
      }

      // Validate assignedTo user if being updated
      if (req.body.assignedTo) {
        const assignedUser = await User.findOne({
          _id: req.body.assignedTo,
          teamId: req.dbUser.teamId,
        });

        if (!assignedUser) {
          return res.status(400).json({
            success: false,
            error: "Assigned user not found in team",
          });
        }
      }

      Object.assign(task, req.body);
      await task.save();

      const populatedTask = await Task.findById(task._id)
        .populate("projectId", "name status")
        .populate("assignedTo", "name email");

      // Emit real-time task update to team members
      const io = req.app.get('io');
      if (io) {
        io.to(req.dbUser.teamId.toString()).emit('task-update-received', populatedTask);
        console.log('Task update broadcasted via Socket.IO to team:', req.dbUser.teamId);
      }

      // Log activity
      const activityType = req.body.assignedTo && req.body.assignedTo !== task.assignedTo?.toString() 
        ? 'task_assigned' 
        : 'task_updated';
      
      const description = activityType === 'task_assigned'
        ? `${req.dbUser.name} assigned task "${populatedTask.title}" to ${populatedTask.assignedTo?.name || 'someone'}`
        : `${req.dbUser.name} updated task "${populatedTask.title}"`;

      await ActivityService.logActivity(
        activityType,
        description,
        req.dbUser._id,
        req.dbUser.teamId,
        populatedTask._id,
        'task',
        { 
          projectName: populatedTask.projectId.name,
          status: populatedTask.status,
          assignedTo: populatedTask.assignedTo?.name
        }
      );

      res.json({
        success: true,
        data: populatedTask,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  // Get task statistics
  getTaskStats: async (req, res) => {
    try {
      // Get projects in user's team
      const projects = await Project.find({ teamId: req.dbUser.teamId });
      const projectIds = projects.map((p) => p._id);

      const filter = { projectId: { $in: projectIds } };

      // If member, only show their tasks
      if (req.dbUser.role === "MEMBER") {
        filter.assignedTo = req.dbUser._id;
      }

      const stats = await Task.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0
      };

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  // Delete task
  deleteTask: async (req, res) => {
    try {
      const task = await Task.findById(req.params.id).populate("projectId");

      if (!task) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      // Check if task's project belongs to user's team
      const project = await Project.findOne({
        _id: task.projectId._id,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }

      await task.deleteOne();

      res.json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
};

module.exports = taskController;