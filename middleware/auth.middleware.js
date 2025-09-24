// const jwt = require("jsonwebtoken");
// const User = require("../models/user.model.js");

// const protectRoute = async (req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             return res.status(401).json({ message: "No token provided, authorization denied" });
//         }

//         const token = authHeader.replace("Bearer ", "");
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         const user = await User.findById(decoded.userId).select("-password");
//         if (!user) return res.status(401).json({ message: "Token is not valid" });

//         req.user = user;
//         next();
//     } catch (error) {
//         console.error("Authentication error:", error);
//         res.status(401).json({ message: "Token is not valid" });
//     }
// };

const mongoose = require("mongoose");

// Middleware fake user, bỏ qua JWT/role
const protectRoute = (req, res, next) => {
  try {
    // ID fake hợp lệ 24 ký tự hex
    const FAKE_USER_ID = "64faaa000000000000000001";

    req.user = {
      _id: new mongoose.Types.ObjectId(FAKE_USER_ID),
      name: "Fake USER",
      role: "USER", // hoặc "ADMIN" / "STAFF" tùy test
    };

    console.log("⚡ Using fake user for testing:", req.user);
    next();
  } catch (err) {
    console.error("Server error in protectRoute:", err);
    res.status(500).json({ message: "Server error in protectRoute" });
  }
};

module.exports = { protectRoute };
