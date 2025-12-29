const Project = require("../models/Project");
const ActivityService = require("../services/activityService");

const projectController = {
  // Get all projects
  getAllProjects: async (req, res) => {
    try {
      const projects = await Project.find({ teamId: req.dbUser.teamId });
      res.json({ success: true, data: projects });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  // Get single project
  getProjectById: async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        teamId: req.dbUser.teamId,
      });
      
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: "Project not found" 
        });
      }
      
      res.json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  // Create project
  createProject: async (req, res) => {
    try {
      const project = new Project({
        ...req.body,
        teamId: req.dbUser.teamId,
        createdBy: req.dbUser._id,
      });
      
      await project.save();

      // Log activity
      await ActivityService.logActivity(
        'project_created',
        `${req.dbUser.name} created project "${project.name}"`,
        req.dbUser._id,
        req.dbUser.teamId,
        project._id,
        'project'
      );

      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  // Update project
  updateProject: async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: "Project not found" 
        });
      }

      // Update project fields
      Object.assign(project, req.body);
      project.updatedAt = new Date();
      
      await project.save();

      // Emit real-time project update to team members
      const io = req.app.get('io');
      if (io) {
        io.to(req.dbUser.teamId.toString()).emit('project-update-received', project);
        console.log('Project update broadcasted via Socket.IO to team:', req.dbUser.teamId);
      }

      // Log activity
      await ActivityService.logActivity(
        'project_updated',
        `${req.dbUser.name} updated project "${project.name}"`,
        req.dbUser._id,
        req.dbUser.teamId,
        project._id,
        'project',
        { status: project.status }
      );

      res.json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  // Delete project
  deleteProject: async (req, res) => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        teamId: req.dbUser.teamId,
      });

      if (!project) {
        return res.status(404).json({ 
          success: false, 
          error: "Project not found" 
        });
      }

      await Project.findByIdAndDelete(req.params.id);
      res.json({ 
        success: true, 
        message: "Project deleted successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },
};

module.exports = projectController;