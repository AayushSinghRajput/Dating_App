import crypto from "crypto";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";
import { generateToken } from "../utils/generate_token.js";
import { sendPasswordResetEmail } from "../utils/email.js";

// @desc    Register user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { username, email, password, acceptedTerms } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!acceptedTerms)
      return res.status(400).json({
        message: "You must confirm you are 18+ and accept the Terms of Service.",
      });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      username,
      email,
      password,
      termsAcceptedAt: new Date(),
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request a password reset code by email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reset password using the emailed code
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Permanently delete the logged-in user's account and all associated data
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete your account" });
    }

    const user = await User.findById(userId);
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const profile = await Profile.findOne({ user: userId });

    if (profile) {
      // Scrub this profile out of everyone else's likes/passes/matches/favorites
      await Profile.updateMany(
        {},
        {
          $pull: {
            likes: profile._id,
            passes: profile._id,
            matches: profile._id,
            favorites: userId,
          },
        }
      );
      await Profile.deleteOne({ _id: profile._id });
    }

    const chats = await Chat.find({ participants: userId });
    const chatIds = chats.map((c) => c._id);
    if (chatIds.length > 0) {
      await Message.deleteMany({ chat: { $in: chatIds } });
      await Chat.deleteMany({ _id: { $in: chatIds } });
    }

    await Notification.deleteMany({ $or: [{ user: userId }, { fromUser: userId }] });

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Error deleting account" });
  }
};
