import DeletionRequest from "../models/deletionRequestModel.js";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List deletion requests with filters & pagination
// @route   GET /api/admin/deletion-requests?status=&search=&page=
// @access  Private/Admin
export const listDeletionRequests = async (req, res) => {
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

  const [requests, total, pendingCount] = await Promise.all([
    DeletionRequest.find(filter)
      .populate("user", "username email createdAt banned isPremium lastActiveAt")
      .populate("resolvedBy", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    DeletionRequest.countDocuments(filter),
    DeletionRequest.countDocuments({ status: "pending" }),
  ]);

  // Enrich with profile name and image
  const userIds = requests.map((r) => r.user?._id).filter(Boolean);
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user name profileImage photos")
    .lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const enriched = requests.map((r) => ({
    ...r,
    profile: r.user?._id ? profileMap[r.user._id.toString()] || null : null,
  }));

  res.status(200).json({
    requests: enriched,
    total,
    page: pageNum,
    pageSize,
    pendingCount,
  });
};

// @desc    Create a deletion request (user-facing or admin simulation)
// @route   POST /api/admin/deletion-requests
// @access  Private/Admin
export const createDeletionRequest = async (req, res) => {
  const { userId, reason } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const existing = await DeletionRequest.findOne({ user: userId, status: "pending" });
  if (existing) {
    return res.status(400).json({ message: "A pending deletion request already exists for this user" });
  }

  const request = await DeletionRequest.create({
    user: userId,
    reason: reason || "User requested account deletion (GDPR)",
    status: "pending",
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_DELETION_REQUEST",
    targetId: userId,
    targetType: "User",
    details: { username: user.username, reason },
    req,
  });

  res.status(201).json({ message: "Deletion request created", request });
};

// @desc    Approve deletion request and permanently purge user data
// @route   POST /api/admin/deletion-requests/:id/approve
// @access  Private/Admin
export const approveDeletionRequest = async (req, res) => {
  const { id } = req.params;

  const request = await DeletionRequest.findById(id).populate("user");
  if (!request) {
    return res.status(404).json({ message: "Deletion request not found" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: `Request is already ${request.status}` });
  }

  const targetUserId = request.user?._id || request.user;
  const username = request.user?.username || "unknown";

  // Purge user's profile
  const profile = await Profile.findOne({ user: targetUserId });
  if (profile) {
    // Remove profile from other users' matches/likes/passes
    await Profile.updateMany(
      { $or: [{ matches: profile._id }, { likes: profile._id }, { passes: profile._id }] },
      { $pull: { matches: profile._id, likes: profile._id, passes: profile._id } }
    );
    await Profile.deleteOne({ _id: profile._id });
  }

  // Purge or anonymize chats and messages
  await Message.deleteMany({ sender: targetUserId });
  await Chat.deleteMany({ participants: targetUserId });

  // Delete the user record
  await User.findByIdAndDelete(targetUserId);

  // Mark request as approved
  request.status = "approved";
  request.resolvedAt = new Date();
  request.resolvedBy = req.user._id;
  await request.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "APPROVE_ACCOUNT_DELETION",
    targetId: targetUserId,
    targetType: "User",
    details: { username, requestId: id },
    req,
  });

  res.status(200).json({
    message: `Account @${username} permanently purged and deletion request approved.`,
    request,
  });
};

// @desc    Reject deletion request
// @route   POST /api/admin/deletion-requests/:id/reject
// @access  Private/Admin
export const rejectDeletionRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const request = await DeletionRequest.findById(id).populate("user", "username email");
  if (!request) {
    return res.status(404).json({ message: "Deletion request not found" });
  }

  if (request.status !== "pending") {
    return res.status(400).json({ message: `Request is already ${request.status}` });
  }

  request.status = "rejected";
  request.rejectionReason = reason || "Request declined by administration.";
  request.resolvedAt = new Date();
  request.resolvedBy = req.user._id;
  await request.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "REJECT_ACCOUNT_DELETION",
    targetId: request.user?._id,
    targetType: "User",
    details: { username: request.user?.username, reason: request.rejectionReason },
    req,
  });

  res.status(200).json({ message: "Deletion request rejected", request });
};
