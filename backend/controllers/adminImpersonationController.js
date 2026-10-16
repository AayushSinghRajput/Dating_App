import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Generate a temporary impersonation session for admin testing
// @route   POST /api/admin/users/:userId/impersonate
// @access  Private/SuperAdmin
export const generateImpersonationSession = async (req, res) => {
  const { userId } = req.params;

  const targetUser = await User.findById(userId).select("-password");
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  const targetProfile = await Profile.findOne({ user: userId });

  // Generate 2-hour scoped token with impersonation metadata
  const impersonationToken = jwt.sign(
    {
      id: targetUser._id,
      isImpersonated: true,
      impersonatedBy: req.user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  await logAdminAction({
    adminId: req.user._id,
    action: "USER_IMPERSONATION_STARTED",
    targetId: userId,
    targetType: "User",
    details: {
      targetUsername: targetUser.username,
      targetEmail: targetUser.email,
      sessionDuration: "2h",
    },
    req,
  });

  res.status(200).json({
    message: `Impersonation session generated for @${targetUser.username}.`,
    impersonationToken,
    expiresIn: "2 hours",
    user: {
      _id: targetUser._id,
      username: targetUser.username,
      email: targetUser.email,
      isPremium: targetUser.isPremium,
      frozen: targetUser.frozen,
      banned: targetUser.banned,
    },
    profile: targetProfile
      ? {
          name: targetProfile.name,
          age: targetProfile.age,
          gender: targetProfile.gender,
          location: targetProfile.location,
          profileImage: targetProfile.profileImage,
          verified: targetProfile.verified,
        }
      : null,
  });
};
