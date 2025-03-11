import express, { Request, Response } from "express";
import { UserModel } from "../config/database";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { userJwtVerify } from "../middlewares/auth.middleware";

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment variables");
}
const JWT_SECRET = process.env.JWT_SECRET;


if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS in environment variables");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const admin = express.Router();

admin.post("/signup", async (req:any, res: any) => {
    try {
        const { username, password, email } = req.body;
        console.log("Signup request received for:", username);

        const userExists = await UserModel.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({ username, email, password: hashedPassword });

        res.status(201).json({ message: "Signup successful" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

admin.post("/signin", async (req: any, res: any) => {
    try {
        const { username, password } = req.body;
        console.log("Signin request received for:", username);

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Signin successful", token });
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


admin.get("/me", userJwtVerify, async (req: any, res: any) => {
    const {token} = req.headers;
    if(!token){
        return res.status(400).json({
            message:"Plese login"
        })
    }
    try{
   const decoded = jwt.verify(token,JWT_SECRET);
   //@ts-ignore
   const user = await UserModel.findOne({_id: decoded.id });
   if(user){
    return res.json({
        message :"Verified successfully",
        user:user
    });
   }else{
       return res.status(404).json({
        message :'User not found'
       })
   }

    }catch(error){
       console.error("Error verifying token or finding user :" ,error);
       return res.status(500).json({
        message :"Internal server error"
       })
    }
});


admin.post("/passwordChange", async (req: any, res: any) => {
    const { username, password, newPassword } = req.body;

    try {
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const matched = await bcrypt.compare(password, user.password);

        if (matched) {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await UserModel.updateOne({ username }, { $set: { password: hashedNewPassword } });

            return res.status(200).json({ message: "Password updated successfully" });
        } else {
            return res.status(400).json({ message: "Incorrect current password" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});


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


admin.post("/forgot-password", async (req: any, res: any) => {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetToken = otp;
        user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes
        await user.save();

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Password reset OTP sent successfully" });
    } catch (error) {
        console.error("Error sending password reset OTP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

admin.post("/reset-password", async (req: any, res: any) => {
    try {
        const { otp, newPassword } = req.body;
        const user = await UserModel.findOne({
            resetToken: otp,
            resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Hash the new password and reset OTP fields
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null as any;
        user.resetTokenExpiry = null as any;

        await user.save();

        res.json({ message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default admin;
