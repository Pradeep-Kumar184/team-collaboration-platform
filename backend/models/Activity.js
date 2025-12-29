const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["project_created", "project_updated", "task_created", "task_updated", "task_assigned", "message_sent", "user_joined"]
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // ID of the related entity (project, task, etc.)
  },
  entityType: {
    type: String,
    enum: ["project", "task", "message", "user"],
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
activitySchema.index({ teamId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Activity", activitySchema);