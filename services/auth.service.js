const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "99d" });
};

const loginService = async (email, password) => {
    if (!email || !password) {
        throw new Error("All fields are required!");
    }

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password!");
    }

    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password!");
    }

    const token = generateToken(user._id);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            profile_image: user.profile_image,
            role: user.role,
            created_at: user.created_at,
        },
    };
};

module.exports = { loginService };
