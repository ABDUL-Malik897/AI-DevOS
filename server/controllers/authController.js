const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (id) => {
    return jwt.sign(
        { id },
        process.env.SECRET,
        { expiresIn: "7d" }
    );
};

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });
        const token = createToken(user._id);
        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                error: "Invalid credentials"
            });
        }
        if (!user.password) {
            return res.status(400).json({
                error: "This account uses Google login"
            });
        }

        const match = await bcrypt.compare(password,user.password);
        if (!match) {
            return res.status(400).json({
                error: "Invalid credentials"
            });
        }
        const token = createToken(user._id);
        res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            token
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const getMe = async (req, res) => {
    res.status(200).json({
        user: req.user
    });
};

module.exports = {
    signup,
    login,
    getMe,
    createToken
};