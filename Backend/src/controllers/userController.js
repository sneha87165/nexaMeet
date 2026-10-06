import { User } from "../models/userModels.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "nexameet_super_secret_jwt_key_2026";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Please provide both username and password" });
    }

    if (mongoose.connection.readyState !== 1) {
        return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ 
            message: "Database is not connected yet. You can use 'Join as Guest' or instant meetings without login!" 
        });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (isPasswordMatch) {
            const token = jwt.sign(
                { id: user._id, username: user.username, name: user.name },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            return res.status(httpStatus.OK).json({
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name
                },
                message: "Login successful"
            });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
};

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields (name, username, password) are required" });
    }

    if (mongoose.connection.readyState !== 1) {
        return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ 
            message: "Database is not connected yet. You can use 'Join as Guest' or instant meetings without login!" 
        });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "Username already exists. Please choose another." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "User registered successfully! Please log in." });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Registration failed: ${e.message}` });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const username = req.user ? req.user.username : null;

        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized: User not identified" });
        }

        const meetings = await Meeting.find({ user_id: username }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Failed to fetch history: ${e.message}` });
    }
};

const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const username = req.user ? req.user.username : null;

        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Unauthorized: User not identified" });
        }

        const newMeeting = new Meeting({
            user_id: username,
            meetingCode: meeting_code
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added meeting to history", meeting: newMeeting });
    } catch (e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Failed to record meeting: ${e.message}` });
    }
};

export { login, register, getUserHistory, addToHistory };