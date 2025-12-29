const ActivityService = require("../services/activityService");

const activityController = {
  // Get team activities
  getTeamActivities: async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const activities = await ActivityService.getTeamActivities(
        req.dbUser.teamId, 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('Get team activities error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to load activities",
      });
    }
  },

  // Get user activities
  getUserActivities: async (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const activities = await ActivityService.getUserActivities(
        req.dbUser._id, 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      console.error('Get user activities error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to load activities",
      });
    }
  },
};

module.exports = activityController;