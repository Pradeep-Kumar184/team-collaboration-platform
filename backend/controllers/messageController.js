const Message = require("../models/Message");
const ActivityService = require("../services/activityService");

const messageController = {
  // Get team chat messages
  getAllMessages: async (req, res) => {
    try {
      console.log('Getting messages for user:', req.dbUser.email, 'teamId:', req.dbUser.teamId);
      
      const { limit = 50, before } = req.query;
      const filter = { teamId: req.dbUser.teamId };

      if (before) {
        filter.timestamp = { $lt: new Date(before) };
      }

      console.log('Message filter:', filter);

      const messages = await Message.find(filter)
        .populate("senderId", "name email")
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      console.log('Found messages:', messages.length);

      res.json({
        success: true,
        data: messages.reverse(), // Return oldest first
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to load messages",
      });
    }
  },

  // Send message in team chat
  sendMessage: async (req, res) => {
    try {
      const { content } = req.body;

      console.log('Sending message:', { content, userId: req.dbUser._id, teamId: req.dbUser.teamId });

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: "Message content is required",
        });
      }

      const message = new Message({
        content: content.trim(),
        senderId: req.dbUser._id,
        teamId: req.dbUser.teamId,
        timestamp: new Date(),
      });

      await message.save();
      console.log('Message saved:', message._id);

      const populatedMessage = await Message.findById(message._id).populate(
        "senderId",
        "name email"
      );

      console.log('Populated message:', populatedMessage);

      // Emit real-time message to team members
      const io = req.app.get('io');
      if (io) {
        io.to(req.dbUser.teamId.toString()).emit('message-received', populatedMessage);
        console.log('Message broadcasted via Socket.IO to team:', req.dbUser.teamId);
      }

      // Log activity
      await ActivityService.logActivity(
        'message_sent',
        `${req.dbUser.name} sent a message`,
        req.dbUser._id,
        req.dbUser.teamId,
        populatedMessage._id,
        'message'
      );

      res.status(201).json({
        success: true,
        data: populatedMessage,
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        error: "Failed to send message",
      });
    }
  },
};

module.exports = messageController;