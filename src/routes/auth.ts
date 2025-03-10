import express, { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import { sendMail } from '../utils/mailer';

const router = express.Router();

router.post('/forgot-password', async (req: any, res: any) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).send('If an account with that email exists, a password reset link has been sent.');
    }

    // Generate token and hash it before storing
    const token = crypto.randomBytes(20).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);

    user.resetPasswordToken = hashedToken;
    //@ts-ignore
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Use environment variable for frontend URL
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendMail(
      email,
      'Password Reset',
      `You requested a password reset. Click the link to reset your password: ${resetURL}`
    );

    res.status(200).send('If an account with that email exists, a password reset link has been sent.');
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
});

export default router;
