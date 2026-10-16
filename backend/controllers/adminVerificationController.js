import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";
import { sendNotification } from "../utils/notify.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List profiles with verification photos or status
// @route   GET /api/admin/verifications?status=all|verified|unverified
// @access  Private/Admin
export const listVerifications = async (req, res) => {
  const { status = "all", search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const filter = {
    verificationPhoto: { $exists: true, $ne: "" },
  };

  if (status === "verified") {
    filter.verified = true;
  } else if (status === "unverified") {
    filter.verified = false;
  }

  if (search.trim()) {
    const matchingUsers = await User.find({
      $or: [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { user: { $in: userIds } },
    ];
  }

  const [profiles, total] = await Promise.all([
    Profile.find(filter)
      .populate("user", "username email createdAt banned isPremium lastActiveAt")
      .select("user name photos profileImage verificationPhoto verified updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Profile.countDocuments(filter),
  ]);

  res.status(200).json({
    verifications: profiles,
    total,
    page: pageNum,
    pageSize,
  });
};

// @desc    Approve or revoke verification badge
// @route   POST /api/admin/verifications/:userId/action
// @access  Private/Admin
export const setVerificationStatus = async (req, res) => {
  const { userId } = req.params;
  const { action, reason } = req.body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
  }

  const update = action === "approve"
    ? { verified: true }
    : { verified: false, verificationPhoto: "" };

  const profile = await Profile.findOneAndUpdate(
    { user: userId },
    update,
    { new: true }
  ).populate("user", "username email");

  if (!profile) return res.status(404).json({ message: "Profile not found" });

  // Send real-time notification to user via socket if available
  const io = req.app.get("io");
  if (io) {
    sendNotification(io, userId, {
      title: action === "approve" ? "Profile Verified!" : "Photo Verification Notice",
      message: action === "approve"
        ? "Congratulations! Your profile has been granted the verified blue badge."
        : reason || "Your verification selfie did not meet the guidelines. Please re-submit in settings.",
      type: "system",
    });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: action === "approve" ? "VERIFICATION_APPROVE" : "VERIFICATION_REJECT",
    targetId: userId,
    targetType: "Profile",
    details: { username: profile.user?.username, action, reason },
    req,
  });

  res.status(200).json({
    message: action === "approve" ? "Verification approved" : "Verification rejected",
    verified: profile.verified,
  });
};
