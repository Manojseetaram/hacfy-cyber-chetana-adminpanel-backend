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
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_1 = __importDefault(require("../models/user"));
const mailer_1 = require("../utils/mailer");
const router = express_1.default.Router();
router.post('/forgot-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res.status(200).send('If an account with that email exists, a password reset link has been sent.');
        }
        // Generate token and hash it before storing
        const token = crypto_1.default.randomBytes(20).toString('hex');
        const hashedToken = yield bcryptjs_1.default.hash(token, 10);
        user.resetPasswordToken = hashedToken;
        //@ts-ignore
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        yield user.save();
        // Use environment variable for frontend URL
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${token}`;
        yield (0, mailer_1.sendMail)(email, 'Password Reset', `You requested a password reset. Click the link to reset your password: ${resetURL}`);
        res.status(200).send('If an account with that email exists, a password reset link has been sent.');
    }
    catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).send('An error occurred. Please try again later.');
    }
}));
exports.default = router;
