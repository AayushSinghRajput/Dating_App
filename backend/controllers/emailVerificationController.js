import crypto from "crypto";
import User from "../models/userModel.js";
import { sendEmailVerificationEmail } from "../utils/email.js";

// @desc    Send a verification code to the logged-in user's current email
// @route   POST /api/auth/send-verification-email
// @access  Private
export const sendVerificationEmail = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.emailVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  user.emailVerificationCode = hashedCode;
  user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendEmailVerificationEmail(user.email, code);

  res.status(200).json({ message: "Verification code sent" });
};

// @desc    Verify the logged-in user's email using the emailed code
// @route   POST /api/auth/verify-email
// @access  Private
export const verifyEmail = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Code is required" });

  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  const user = await User.findOne({
    _id: req.user.id,
    emailVerificationCode: hashedCode,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationCode +emailVerificationExpires");

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  user.emailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Email verified successfully" });
};

// @desc    Change the logged-in user's email (requires password confirmation
//          and resets verification status, since the new address is unverified)
// @route   POST /api/auth/change-email
// @access  Private
export const changeEmail = async (req, res) => {
  const { newEmail, password } = req.body;
  if (!newEmail || !password) {
    return res.status(400).json({ message: "New email and password are required" });
  }

  const user = await User.findById(req.user.id);
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  const existing = await User.findOne({ email: newEmail });
  if (existing) {
    return res.status(400).json({ message: "That email is already in use" });
  }

  user.email = newEmail;
  user.emailVerified = false;
  await user.save();

  res.status(200).json({ message: "Email updated. Please verify your new email.", email: user.email });
};
