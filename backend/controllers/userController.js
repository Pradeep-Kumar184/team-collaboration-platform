const User = require("../models/User");
const Team = require("../models/Team");

const userController = {
  // Get all users in team
  getTeamUsers: async (req, res) => {
    try {
      console.log('Fetching team users for teamId:', req.dbUser.teamId);
      
      const users = await User.find({ teamId: req.dbUser.teamId })
        .select("-firebaseUid")
        .sort({ role: 1, name: 1 });

      console.log(`Found ${users.length} users in team:`, users.map(u => ({ name: u.name, email: u.email, role: u.role, teamId: u.teamId })));

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('Get team users error:', error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  // Debug endpoint to check and fix team membership
  debugTeamMembership: async (req, res) => {
    try {
      console.log('=== TEAM MEMBERSHIP DEBUG ===');
      
      // Get all users
      const allUsers = await User.find({}).select('name email role teamId');
      console.log('All users in database:', allUsers);
      
      // Get all teams
      const allTeams = await Team.find({}).populate('members', 'name email');
      console.log('All teams in database:', allTeams);
      
      // Find users without teamId
      const usersWithoutTeam = allUsers.filter(user => !user.teamId);
      console.log('Users without teamId:', usersWithoutTeam);
      
      // Get default/company team
      const companyTeam = await Team.findOne({ 
        $or: [
          { name: "Company Team" },
          { name: "Default Team" }
        ]
      });
      console.log('Company team:', companyTeam);
      
      // Fix users without teamId
      if (usersWithoutTeam.length > 0 && companyTeam) {
        console.log('Fixing users without teamId...');
        
        for (const user of usersWithoutTeam) {
          // Add user to team members if not already there
          if (!companyTeam.members.includes(user._id)) {
            companyTeam.members.push(user._id);
          }
          
          // Assign teamId to user
          user.teamId = companyTeam._id;
          await user.save();
          
          console.log(`✅ Fixed user ${user.name} - added to company team`);
        }
        
        await companyTeam.save();
        console.log('Company team updated with new members');
      }
      
      // Get updated counts
      const updatedUsers = await User.find({ teamId: companyTeam?._id });
      console.log(`📊 Final count: ${updatedUsers.length} users in company team`);
      
      res.json({
        success: true,
        data: {
          totalUsers: allUsers.length,
          usersInCompanyTeam: updatedUsers.length,
          usersFixed: usersWithoutTeam.length,
          companyTeam: companyTeam,
          allUsers: updatedUsers.map(u => ({ name: u.name, email: u.email, role: u.role }))
        }
      });
    } catch (error) {
      console.error('Debug team membership error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      // Validate role
      if (!["ADMIN", "MANAGER", "MEMBER"].includes(role)) {
        return res.status(400).json({
          success: false,
          error: "Invalid role",
        });
      }

      // Check if user exists and belongs to same team
      const user = await User.findOne({
        _id: userId,
        teamId: req.dbUser.teamId,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Cannot change your own role if you're the only admin
      if (user._id.toString() === req.dbUser._id.toString()) {
        const adminCount = await User.countDocuments({
          teamId: req.dbUser.teamId,
          role: "ADMIN",
        });

        if (adminCount === 1 && role !== "ADMIN") {
          return res.status(400).json({
            success: false,
            error: "Cannot remove the only admin from team",
          });
        }
      }

      user.role = role;
      await user.save();

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
};

module.exports = userController;