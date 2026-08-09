import crypto from "crypto";
import User from "../models/userModel.js";
import { sendPasswordResetEmail } from "../utils/email.js";

// @desc    Request a password reset code by email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });

  // Always respond the same way whether or not the email is registered,
  // so this endpoint can't be used to check which emails have accounts.
  if (user) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, code);
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);
    }
  }

  res.status(200).json({
    message: "If an account with that email exists, we've sent a reset code.",
  });
};

// @desc    Reset password using the emailed code
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "Email, code, and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset code" });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successfully" });
};

// @desc    Change password for the logged-in user
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  const user = await User.findById(req.user.id);
  if (!user || !(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password changed successfully" });
};
