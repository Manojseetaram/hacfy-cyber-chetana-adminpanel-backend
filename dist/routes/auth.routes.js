"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
dotenv_1.default.config();
if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
}
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const admin = express_1.default.Router();
admin.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, email } = req.body;
        console.log("Signup request received for:", username);
        const userExists = yield database_1.UserModel.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username already taken" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        yield database_1.UserModel.create({ username, email, password: hashedPassword });
        res.status(201).json({ message: "Signup successful" });
    }
    catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
admin.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        console.log("Signin request received for:", username);
        const user = yield database_1.UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Signin successful", token });
    }
    catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
admin.get("/me", auth_middleware_1.userJwtVerify, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.headers;
    if (!token) {
        return res.status(400).json({
            message: "Plese login"
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        //@ts-ignore
        const user = yield database_1.UserModel.findOne({ _id: decoded.id });
        if (user) {
            return res.json({
                message: "Verified successfully",
                user: user
            });
        }
        else {
            return res.status(404).json({
                message: 'User not found'
            });
        }
    }
    catch (error) {
        console.error("Error verifying token or finding user :", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}));
admin.post("/passwordChange", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, newPassword } = req.body;
    try {
        const user = yield database_1.UserModel.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const matched = yield bcrypt_1.default.compare(password, user.password);
        if (matched) {
            const hashedNewPassword = yield bcrypt_1.default.hash(newPassword, 10);
            yield database_1.UserModel.updateOne({ username }, { $set: { password: hashedNewPassword } });
            return res.status(200).json({ message: "Password updated successfully" });
        }
        else {
            return res.status(400).json({ message: "Incorrect current password" });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
}));
// admin.post("/forgot-password", async (req: any, res: any) => {
//     try {
//         const { email } = req.body;
//         const user = await UserModel.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         const token = crypto.randomBytes(32).toString("hex");
//         user.resetToken = token;
//         user.resetTokenExpiry = new Date(Date.now() + 3600000); 
//         await user.save();
//         const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: "Password Reset Request",
//             text: `Click the link below to reset your password:\n\nhttp://localhost:3000/reset-password/${token}`,
//         };
//         await transporter.sendMail(mailOptions);
//         res.json({ message: "Password reset email sent successfully" });
//     } catch (error) {
//         console.error("Error sending password reset email:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });
// admin.post("/reset-password", async (req: any, res: any) => {
//     try {
//         const { token, newPassword } = req.body;
//         const user = await UserModel.findOne({
//             resetToken: token,
//             resetTokenExpiry: { $gt: new Date() },
//         });
//         if (!user) {
//             return res.status(400).json({ message: "Invalid or expired token" });
//         }
//         user.password = await bcrypt.hash(newPassword, 10);
//         user.resetToken = null as any;
//         user.resetTokenExpiry = null as any;
//         await user.save();
//         res.json({ message: "Password has been reset successfully" });
//     } catch (error) {
//         console.error("Error resetting password:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });
admin.post("/forgot-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield database_1.UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Generate a 6-digit random OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetToken = otp;
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
        yield user.save();
        // Email Configuration
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
        };
        yield transporter.sendMail(mailOptions);
        res.json({ message: "Password reset OTP sent successfully" });
    }
    catch (error) {
        console.error("Error sending password reset OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
admin.post("/reset-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, newPassword } = req.body;
        const user = yield database_1.UserModel.findOne({
            resetToken: otp,
            resetTokenExpiry: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        // Hash the new password and reset OTP fields
        user.password = yield bcrypt_1.default.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        yield user.save();
        res.json({ message: "Password has been reset successfully" });
    }
    catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
exports.default = admin;
