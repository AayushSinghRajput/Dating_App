import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";
import ModerationFlag from "../models/moderationFlagModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Cloudinary webhook for auto-moderation
// @route   POST /api/admin/cloudinary-webhook
// @access  Public (called by Cloudinary)
export const cloudinaryModerationWebhook = async (req, res) => {
  try {
    const { public_id, secure_url, moderation } = req.body || {};
    const latestModeration = Array.isArray(moderation) ? moderation[moderation.length - 1] : moderation;

    if (!public_id || !latestModeration) {
      return res.status(200).json({ received: true });
    }

    const isRejected = latestModeration.status === "rejected";
    const profile = await Profile.findOne({ photos: secure_url }).populate("user");

    if (profile && isRejected) {
      // Create pending moderation flag so admins can review/override
      await ModerationFlag.create({
        user: profile.user._id,
        photoUrl: secure_url,
        flagType: "nsfw",
        confidenceScore: 92,
        status: "pending",
        reviewNotes: "Automatically flagged by Cloudinary AI Vision moderation",
      });

      // Auto-quarantine: remove from active display until admin approves or confirms reject
      profile.photos = profile.photos.filter((p) => p !== secure_url);
      if (profile.profileImage === secure_url) {
        profile.profileImage = profile.photos[0] || "";
      }
      await profile.save();
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling Cloudinary moderation webhook:", error);
    res.status(500).json({ received: false });
  }
};

// @desc    List AI/User-flagged photos queue
// @route   GET /api/admin/moderation/photos?status=pending|approved|rejected&search=&page=
// @access  Private/Admin
export const listModerationFlags = async (req, res) => {
  const { status = "all", search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  if (search.trim()) {
    const matchingUsers = await User.find({
      $or: [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ],
    }).select("_id");
    filter.user = { $in: matchingUsers.map((u) => u._id) };
  }

  const [flags, total, pendingCount] = await Promise.all([
    ModerationFlag.find(filter)
      .populate("user", "username email createdAt isPremium banned")
      .populate("reviewedBy", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    ModerationFlag.countDocuments(filter),
    ModerationFlag.countDocuments({ status: "pending" }),
  ]);

  // Enrich with profile images and name
  const userIds = flags.map((f) => f.user?._id).filter(Boolean);
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user name profileImage photos")
    .lean();
  const profileLookup = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const enriched = flags.map((f) => ({
    ...f,
    profile: f.user?._id ? profileLookup[f.user._id.toString()] || null : null,
  }));

  res.status(200).json({
    flags: enriched,
    total,
    page: pageNum,
    pageSize,
    pendingCount,
  });
};

// @desc    Approve or reject/delete a flagged photo
// @route   POST /api/admin/moderation/photos/:id/action
// @access  Private/Admin
export const actionModerationFlag = async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
  }

  const flag = await ModerationFlag.findById(id).populate("user", "username email");
  if (!flag) return res.status(404).json({ message: "Flag record not found" });

  const targetUserId = flag.user?._id;
  const profile = await Profile.findOne({ user: targetUserId });

  if (action === "approve") {
    // Restore photo to profile if missing
    if (profile && !profile.photos.includes(flag.photoUrl)) {
      profile.photos.push(flag.photoUrl);
      if (!profile.profileImage) profile.profileImage = flag.photoUrl;
      await profile.save();
    }
    flag.status = "approved";
  } else {
    // Permanently remove photo from profile
    if (profile) {
      profile.photos = profile.photos.filter((p) => p !== flag.photoUrl);
      if (profile.profileImage === flag.photoUrl) {
        profile.profileImage = profile.photos[0] || "";
      }
      await profile.save();
    }
    flag.status = "rejected";
  }

  flag.reviewedBy = req.user._id;
  flag.reviewedAt = new Date();
  flag.reviewNotes = notes || (action === "approve" ? "Approved as safe" : "Confirmed violation and purged");
  await flag.save();

  await logAdminAction({
    adminId: req.user._id,
    action: action === "approve" ? "APPROVE_PHOTO" : "REJECT_PHOTO",
    targetId: targetUserId,
    targetType: "PhotoModeration",
    details: { photoUrl: flag.photoUrl, action, notes: flag.reviewNotes },
    req,
  });

  res.status(200).json({
    message: `Photo ${action === "approve" ? "approved and restored" : "rejected and removed"}`,
    flag,
  });
};

// @desc    Manually flag or simulate an AI-detected photo for review
// @route   POST /api/admin/moderation/photos
// @access  Private/Admin
export const createPhotoFlag = async (req, res) => {
  const { userId, photoUrl, flagType = "nsfw", confidenceScore = 88, reviewNotes } = req.body;

  if (!userId || !photoUrl) {
    return res.status(400).json({ message: "userId and photoUrl are required" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const flag = await ModerationFlag.create({
    user: userId,
    photoUrl,
    flagType,
    confidenceScore: Number(confidenceScore) || 85,
    status: "pending",
    reviewNotes: reviewNotes || "Manually queued for administrative review",
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "FLAG_PHOTO",
    targetId: userId,
    targetType: "PhotoModeration",
    details: { photoUrl, flagType },
    req,
  });

  res.status(201).json({ message: "Photo queued for moderation review", flag });
};
