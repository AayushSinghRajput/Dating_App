import Profile from "../models/profileModel.js";
import { performBlock } from "../utils/block.js";
import { logEvent } from "../services/recommendation/eventLogger.js";

// @desc Block a user: hides each other from discovery, breaks any existing
// match/like, and deletes their chat history. Blocking is silent (no notification).
// @route POST /api/profile/:targetUserId/block
// @access Private
export const blockUser = async (req, res) => {
  const loggedInUserId = req.user.id;
  const { targetUserId } = req.params;

  if (loggedInUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot block yourself." });
  }

  const blockedUsers = await performBlock(loggedInUserId, targetUserId);
  logEvent(loggedInUserId, targetUserId, "BLOCK");
  res.status(200).json({ message: "User blocked", blockedUsers });
};

// @desc Unblock a user
// @route POST /api/profile/:targetUserId/unblock
// @access Private
export const unblockUser = async (req, res) => {
  const loggedInUserId = req.user.id;
  const { targetUserId } = req.params;

  const profile = await Profile.findOne({ user: loggedInUserId });
  if (!profile) return res.status(404).json({ message: "Profile not found for this user." });

  profile.blockedUsers = profile.blockedUsers.filter((id) => id.toString() !== targetUserId);
  await profile.save();

  res.status(200).json({ message: "User unblocked", blockedUsers: profile.blockedUsers });
};

// @desc Get all users the logged-in user has blocked
// @route GET /api/profile/blocked
// @access Private
export const getBlockedUsers = async (req, res) => {
  const loggedInUserId = req.user.id;

  const profile = await Profile.findOne({ user: loggedInUserId }).populate(
    "blockedUsers",
    "username email"
  );
  if (!profile) return res.status(404).json({ message: "Profile not found for this user." });

  // Batch-fetch every blocked user's profile in one query instead of one
  // query per blocked user.
  const blockedUserIds = profile.blockedUsers.map((u) => u._id);
  const blockedProfiles = await Profile.find({ user: { $in: blockedUserIds } })
    .select("user profileImage age location")
    .lean();
  const profileByUserId = new Map(blockedProfiles.map((p) => [p.user.toString(), p]));

  const blockedUsers = profile.blockedUsers.map((u) => {
    const blockedProfile = profileByUserId.get(u._id.toString());
    return {
      _id: u._id,
      username: u.username,
      profileImage: blockedProfile?.profileImage || "",
      age: blockedProfile?.age,
      location: blockedProfile?.location,
    };
  });

  res.status(200).json({ blockedUsers });
};
