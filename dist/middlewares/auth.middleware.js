"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userJwtVerify = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const userJwtVerify = (req, res, next) => {
    try {
        const token = req.headers.token;
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded) {
            req.userId = decoded.indexOf;
            next();
        }
        else {
            res.status(403).json({
                message: "You are not signed in"
            });
        }
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};
exports.userJwtVerify = userJwtVerify;
exports = { userJwtVerify: exports.userJwtVerify };
