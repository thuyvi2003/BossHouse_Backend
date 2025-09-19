import jwt from "jsonwebtoken";
import User from '../models/User.js';

const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided, authorization denied" });
        }

        const token = authHeader.replace("Bearer ", "");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password"); // dùng decoded.userId (phù hợp với bạn đã dùng userId khi sign)

        if (!user) return res.status(401).json({ message: "Token is not valid" });

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ message: "Token is not valid" });
    }
};

export default protectRoute;
