const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const protectRoute = (requiredRole) => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided, authorization denied" });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        // Check if user is banned
        if (user.is_banned) {
            return res.status(403).json({ message: "Account is banned" });
        }

        // Check if user has the required role (if specified)
        if (requiredRole && user.role !== requiredRole) {
            return res.status(403).json({ message: `Access denied: ${requiredRole} role required` });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = protectRoute;