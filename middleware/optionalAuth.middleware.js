const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const TokenBlacklist = require('../models/tokenblacklist.model');

// Optional authentication middleware - không bắt buộc, nhưng nếu có token thì parse
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      
      // Check blacklist
      const blacklisted = await TokenBlacklist.findOne({ token });
      if (!blacklisted) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId).select("-password");
          if (user && !user.is_banned) {
            req.user = user;
          }
        } catch (error) {
        }
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;


