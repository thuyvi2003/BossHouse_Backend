const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            minlength: 6,
            required: function () {
                // Password is only required if a google_id is NOT present
                return !this.google_id;
            },
        },
        google_id: {
            type: String,
            unique: true,
            sparse: true,
        },
        profile_image: {
            type: String,
            default: "",
        },
        role: {
            type: String,
            enum: ["user", "admin", "staff", "veterinarian", "guest"],
            default: "user",
        },
        // Total membership points (number) used for membership rank calculation
        membership_points: {
            type: Number,
            default: 0,
        },
        // Whether the user is banned (separate boolean flag)
        is_banned: {
            type: Boolean,
            default: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
        login_history: [
            {
                login_time: {
                    type: Date,
                    default: Date.now,
                },
                login_type: {
                    type: String,
                    enum: ["email", "google"],
                    required: true,
                },
            },
        ],
    },
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

// 🔑 Hash password before saving
userSchema.pre("save", async function (next) {
    // Only hash the password if it's been modified AND the user doesn't have a google_id
    if (!this.isModified("password") || this.google_id) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 🔑 Compare password function
userSchema.methods.comparePassword = async function (userPassword) {
    // If the user has a password, compare it; otherwise, return false
    if (this.password) {
        return await bcrypt.compare(userPassword, this.password);
    }
    return false;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
