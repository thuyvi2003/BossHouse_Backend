const { loginService } = require("../services/auth.service.js");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await loginService(email, password);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = { login };
