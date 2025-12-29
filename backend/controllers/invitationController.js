const Invitation = require("../models/Invitation");
const Team = require("../models/Team");
const User = require("../models/User");
const ActivityService = require("../services/activityService");
const crypto = require("crypto");

const invitationController = {
  // Create invitation (ADMIN/MANAGER only)
  createInvitation: async (req, res) => {
    try {
      const { email, role = "MEMBER" } = req.body;

      // Generate unique invitation code
      const code = crypto.randomBytes(16).toString("hex");

      const invitation = new Invitation({
        code,
        teamId: req.dbUser.teamId,
        createdBy: req.dbUser._id,
        email,
        role,
      });

      await invitation.save();

      // Log activity
      await ActivityService.logActivity(
        'invitation_created',
        `${req.dbUser.name} created an invitation${email ? ` for ${email}` : ''}`,
        req.dbUser._id,
        req.dbUser.teamId,
        invitation._id,
        'invitation'
      );

      res.status(201).json({
        success: true,
        data: {
          code: invitation.code,
          invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${invitation.code}`,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error('Create invitation error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to create invitation",
      });
    }
  },

  // Get team invitations (ADMIN/MANAGER only)
  getTeamInvitations: async (req, res) => {
    try {
      const invitations = await Invitation.find({ 
        teamId: req.dbUser.teamId,
        expiresAt: { $gt: new Date() } // Only non-expired invitations
      })
        .populate("createdBy", "name email")
        .populate("usedBy", "name email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: invitations,
      });
    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to load invitations",
      });
    }
  },

  // Validate invitation code (public endpoint)
  validateInvitation: async (req, res) => {
    try {
      const { code } = req.params;

      const invitation = await Invitation.findOne({
        code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).populate("teamId", "name description");

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invalid or expired invitation code",
        });
      }

      res.json({
        success: true,
        data: {
          teamName: invitation.teamId.name,
          teamDescription: invitation.teamId.description,
          role: invitation.role,
          email: invitation.email,
        },
      });
    } catch (error) {
      console.error('Validate invitation error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to validate invitation",
      });
    }
  },

  // Use invitation code during registration
  useInvitation: async (req, res) => {
    try {
      const { code, userEmail } = req.body;

      const invitation = await Invitation.findOne({
        code,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invalid or expired invitation code",
        });
      }

      // Check if invitation is for specific email
      if (invitation.email && invitation.email !== userEmail) {
        return res.status(403).json({
          success: false,
          error: "This invitation is for a different email address",
        });
      }

      // Mark invitation as used
      invitation.isUsed = true;
      invitation.usedBy = req.dbUser._id;
      await invitation.save();

      // Add user to team
      const team = await Team.findById(invitation.teamId);
      if (team && !team.members.includes(req.dbUser._id)) {
        team.members.push(req.dbUser._id);
        await team.save();
      }

      // Update user's team and role
      req.dbUser.teamId = invitation.teamId;
      req.dbUser.role = invitation.role;
      await req.dbUser.save();

      // Log activity
      await ActivityService.logActivity(
        'user_joined',
        `${req.dbUser.name} joined the team via invitation`,
        req.dbUser._id,
        invitation.teamId,
        req.dbUser._id,
        'user'
      );

      res.json({
        success: true,
        data: req.dbUser,
      });
    } catch (error) {
      console.error('Use invitation error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to use invitation",
      });
    }
  },

  // Delete invitation (ADMIN/MANAGER only)
  deleteInvitation: async (req, res) => {
    try {
      const invitation = await Invitation.findOne({
        _id: req.params.id,
        teamId: req.dbUser.teamId,
      });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: "Invitation not found",
        });
      }

      await invitation.deleteOne();

      res.json({
        success: true,
        message: "Invitation deleted successfully",
      });
    } catch (error) {
      console.error('Delete invitation error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to delete invitation",
      });
    }
  },
};

module.exports = invitationController;