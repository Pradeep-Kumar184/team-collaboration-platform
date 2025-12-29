const admin = require("../config/firebase");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: "No token provided" 
      });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    // Find or create user
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      user = new User({
        email: decoded.email,
        name: decoded.name || decoded.email.split('@')[0],
        firebaseUid: decoded.uid,
        role: "MEMBER",
      });
      await user.save();
    }

    req.dbUser = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: "Invalid token" 
    });
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.dbUser.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

module.exports = { auth, roleMiddleware };
