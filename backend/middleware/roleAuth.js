const roleAuth = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: "Insufficient permissions. This action requires " + 
                 allowedRoles.join(" or ") + " role."
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Authorization check failed"
      });
    }
  };
};

module.exports = roleAuth;