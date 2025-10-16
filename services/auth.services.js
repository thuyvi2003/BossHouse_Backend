const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const NodeCache = require("node-cache");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

// Initialize in-memory cache for OTP and reset tokens
const otpCache = new NodeCache({
    stdTTL: 300, // OTP expires after 5 minutes
    checkperiod: 60,
});

const cooldownCache = new NodeCache({
    stdTTL: 30, // 30 seconds cooldown for OTP resend
    checkperiod: 10,
});

const resetTokenCache = new NodeCache({
    stdTTL: 900, // Reset token expires after 15 minutes
    checkperiod: 60,
});

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Google OAuth2 client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "99d" });
};

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Registration",
        text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

const sendResetLink = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        text: `Click the following link to reset your password: ${resetLink}\nThis link is valid for 15 minutes.`,
    };

    await transporter.sendMail(mailOptions);
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

    // check if account is deleted
    if (user.is_deleted) {
        throw new Error("This account has been deleted!");
    }

    // check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password!");
    }

    // Log login event
    user.login_history.push({
        login_time: new Date(),
        login_type: "email",
    });
    await user.save();

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

const registerService = async (name, email, password) => {
    if (!name || !email || !password) {
        throw new Error("All fields are required!");
    }

    if (password.length < 6) {
        throw new Error("Password should be at least 6 characters long!");
    }

    if (name.length < 3) {
        throw new Error("Name should be at least 3 characters long!");
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new Error("Email already exists!");
    }

    const otp = generateOTP();
    otpCache.set(email, { name, password, otp });

    await sendOTP(email, otp);

    return { success: true, message: "OTP sent to your email!" };
};

const resendOTP = async (email) => {
    if (cooldownCache.get(email)) {
        throw new Error("Please wait 30 seconds before resending OTP!");
    }

    const cachedData = otpCache.get(email);
    if (!cachedData) {
        throw new Error("No pending registration found for this email!");
    }

    const newOTP = generateOTP();
    otpCache.set(email, { ...cachedData, otp: newOTP });

    cooldownCache.set(email, true);

    await sendOTP(email, newOTP);

    return { success: true, message: "New OTP sent to your email!" };
};

const verifyOTP = async (email, otp) => {
    const cachedData = otpCache.get(email);
    if (!cachedData) {
        throw new Error("OTP expired or invalid!");
    }

    if (cachedData.otp !== otp) {
        throw new Error("Invalid OTP!");
    }

    const profile_image = `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`;
    const user = new User({
        name: cachedData.name,
        email,
        password: cachedData.password,
        profile_image,
    });

    await user.save();

    otpCache.del(email);

    return { success: true, message: "Registration successful!" };
};

const forgotPasswordService = async (email) => {
    if (!email) {
        throw new Error("Email is required!");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("No user found with this email!");
    }

    // 🚫 Block Google-only accounts from using forgot password
    if (!user.password && user.google_id) {
        throw new Error("This account uses Google login. Please sign in with Google.");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    resetTokenCache.set(resetToken, { email });

    await sendResetLink(email, resetToken);

    return { success: true, message: "Password reset link sent to your email!" };
};


const resetPasswordService = async (email, token, newPassword, confirmPassword) => {
    if (!email || !token || !newPassword || !confirmPassword) {
        throw new Error("All fields are required!");
    }

    if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match!");
    }

    if (newPassword.length < 6) {
        throw new Error("Password should be at least 6 characters long!");
    }

    const cachedToken = resetTokenCache.get(token);
    if (!cachedToken || cachedToken.email !== email) {
        throw new Error("Invalid or expired reset token!");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not found!");
    }

    user.password = newPassword;
    await user.save();

    resetTokenCache.del(token);

    return { success: true, message: "Password reset successful!" };
};

// Google OAuth2 login service
const googleLoginService = async (idToken) => {
    if (!idToken) {
        throw new Error("Google ID token is required!");
    }

    try {
        // Verify the ID token
        const ticket = await client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error("Invalid Google token payload!");
        }

        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            throw new Error("Email not found in Google token!");
        }

        // Check if user already exists
        let user = await User.findOne({
            $or: [
                { email },
                { google_id: googleId }
            ]
        });

        // Check if account is deleted
        if (user && user.is_deleted) {
            throw new Error("This account has been deleted!");
        }

        if (!user) {
            // Create new user with Google data
            user = new User({
                name: name || 'Google User',
                email,
                google_id: googleId,
                profile_image: picture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${email}`,
                role: 'user',
                // No password set for Google users
            });

            await user.save();
        } else if (!user.google_id) {
            // User exists with email but not linked to Google
            // Prevent login and throw a custom error instead of linking
            throw new Error("Social login is not linked to any account.");
        }

        // Log login event
        user.login_history.push({
            login_time: new Date(),
            login_type: "google",
        });
        await user.save();

        // Generate JWT token
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
    } catch (error) {
        console.error("Google login error:", error);
        throw new Error("Failed to authenticate with Google!");
    }
};

module.exports = {
    loginService,
    registerService,
    resendOTP,
    verifyOTP,
    forgotPasswordService,
    resetPasswordService,
    googleLoginService
};