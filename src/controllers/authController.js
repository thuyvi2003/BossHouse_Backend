import User from "../models/User.js";
import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "99d" });
};

// Login controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password!" });
        }

        // check if password is correct
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid email or password!" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profile_image: user.profile_image,
                role: user.role,
                created_at: user.created_at,
            },
        });

    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};