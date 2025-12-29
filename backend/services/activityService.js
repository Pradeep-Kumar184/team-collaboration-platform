const Activity = require("../models/Activity");

class ActivityService {
  static async logActivity(type, description, userId, teamId, entityId = null, entityType = null, metadata = {}) {
    try {
      const activity = new Activity({
        type,
        description,
        userId,
        teamId,
        entityId,
        entityType,
        metadata,
        timestamp: new Date()
      });

      await activity.save();
      console.log(`Activity logged: ${type} by user ${userId}`);
      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getTeamActivities(teamId, limit = 20) {
    try {
      const activities = await Activity.find({ teamId })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('Failed to get team activities:', error);
      return [];
    }
  }

  static async getUserActivities(userId, limit = 20) {
    try {
      const activities = await Activity.find({ userId })
        .populate('userId', 'name email')
        .sort({ timestamp: -1 })
        .limit(limit);

      return activities;
    } catch (error) {
      console.error('Failed to get user activities:', error);
      return [];
    }
  }
}

module.exports = ActivityService;