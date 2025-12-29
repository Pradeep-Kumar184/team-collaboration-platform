const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: false, // Optional - for specific email invitations
  },
  role: {
    type: String,
    enum: ["ADMIN", "MANAGER", "MEMBER"],
    default: "MEMBER",
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
invitationSchema.index({ code: 1 });
invitationSchema.index({ teamId: 1 });
invitationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("Invitation", invitationSchema);