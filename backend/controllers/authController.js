const User = require("../models/User");
const Team = require("../models/Team");

const authController = {
  // Register/Login user (called after Firebase auth)
  register: async (req, res) => {
    try {
      const { email, name, role } = req.body;
      const firebaseUid = req.headers["x-firebase-uid"] || req.user?.uid || "dev-user-id";
      
      if (!firebaseUid) {
        return res.status(400).json({
          success: false,
          error: "Firebase UID is required",
        });
      }

      // Check if user already exists
      let user = await User.findOne({
        $or: [{ email }, { firebaseUid }],
      });

      if (user) {
        return res.json({
          success: true,
          data: user,
        });
      }

      // Create new user
      user = new User({
        email,
        name,
        role: role || "MEMBER",
        firebaseUid,
      });

      // If user is first user, create a team
      const userCount = await User.countDocuments();
      console.log(`Total users in system: ${userCount}`);
      
      if (userCount === 0) {
        console.log('First user detected, creating admin and default team');
        user.role = "ADMIN";
        await user.save();

        // Create default team
        const team = new Team({
          name: "Company Team", // Changed to Company Team
          description: "Main company team for all employees",
          adminId: user._id,
          members: [user._id],
        });
        await team.save();

        // Assign team to user
        user.teamId = team._id;
        await user.save();

        console.log(`✅ First user ${user.name} created as ADMIN with company team`);

        return res.status(201).json({
          success: true,
          data: { user, team },
        });
      }

      await user.save();

      // Add user to company team (create one if it doesn't exist)
      let companyTeam = await Team.findOne({ 
        $or: [
          { name: "Company Team" },
          { name: "Default Team" } // Backward compatibility
        ]
      });
      
      if (!companyTeam) {
        // Create company team if it doesn't exist
        console.log('Creating company team as it does not exist');
        companyTeam = new Team({
          name: "Company Team",
          description: "Main company team for all employees",
          adminId: user._id, // Make this user admin of the team
          members: [user._id],
        });
        await companyTeam.save();
        
        // If this user becomes the first admin, upgrade their role
        user.role = "ADMIN";
      } else {
        // Add user to existing company team - GUARANTEED ADDITION
        if (!companyTeam.members.includes(user._id)) {
          companyTeam.members.push(user._id);
          await companyTeam.save();
          console.log(`➕ Added ${user.name} to company team members`);
        }
      }

      // Assign team to user - EVERY USER GETS TEAM ACCESS
      user.teamId = companyTeam._id;
      await user.save();

      // Log activity for new team member joining
      const ActivityService = require("../services/activityService");
      await ActivityService.logActivity(
        'user_joined',
        `${user.name} joined the company team`,
        user._id,
        companyTeam._id,
        user._id,
        'user'
      );

      console.log(`✅ SUCCESS: User ${user.name} (${user.email}) added to company team with role ${user.role}`);
      console.log(`📊 Company team now has ${companyTeam.members.length} total members`);

      res.status(201).json({
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

  // Get current user info
  getMe: async (req, res) => {
    try {
      let user = await User.findOne({ firebaseUid: req.user.uid }).populate(
        "teamId",
        "name description"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      // Check if user has teamId, if not assign to company team
      if (!user.teamId) {
        console.log(`🔧 FIXING: User ${user.email} has no teamId, assigning to company team`);
        
        let companyTeam = await Team.findOne({ 
          $or: [
            { name: "Company Team" },
            { name: "Default Team" } // Backward compatibility
          ]
        });
        
        if (!companyTeam) {
          // Create company team if it doesn't exist
          console.log('Creating company team as it does not exist');
          companyTeam = new Team({
            name: "Company Team",
            description: "Main company team for all employees",
            adminId: user._id,
            members: [user._id],
          });
          await companyTeam.save();
          user.role = "ADMIN"; // Make first user admin
        } else {
          // Add user to existing company team
          if (!companyTeam.members.includes(user._id)) {
            companyTeam.members.push(user._id);
            await companyTeam.save();
            console.log(`➕ Added ${user.name} to company team members`);
          }
        }

        // Assign team to user
        user.teamId = companyTeam._id;
        await user.save();

        // Log activity
        const ActivityService = require("../services/activityService");
        await ActivityService.logActivity(
          'user_joined',
          `${user.name} joined the company team`,
          user._id,
          companyTeam._id,
          user._id,
          'user'
        );

        // Reload user with populated teamId
        user = await User.findById(user._id).populate("teamId", "name description");
        console.log(`✅ FIXED: User ${user.email} assigned to company team`);
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
};

module.exports = authController;