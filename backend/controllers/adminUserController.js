import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { notifyBannedUser } from "../utils/notify.js";

const PAGE_SIZE = 25;

// @desc    List/search users
// @route   GET /api/admin/users?search=&page=
// @access  Private/Admin
export const listUsers = async (req, res) => {
  const { search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const filter = search
    ? {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("username email createdAt banned isPremium isAdmin lastActiveAt")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({ users, total, page: pageNum, pageSize: PAGE_SIZE });
};

// @desc    Ban a user (blocks all further authenticated requests)
// @route   POST /api/admin/users/:userId/ban
// @access  Private/Admin
export const banUser = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (userId === req.user.id) {
    return res.status(400).json({ message: "You can't ban yourself." });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { banned: true, bannedAt: new Date(), banReason: reason || "" },
    { new: true }
  ).select("username email banned");

  if (!user) return res.status(404).json({ message: "User not found" });

  notifyBannedUser(req.app.get("io"), userId, reason);

  res.status(200).json({ message: "User banned", user });
};

// @desc    Lift a ban
// @route   POST /api/admin/users/:userId/unban
// @access  Private/Admin
export const unbanUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { banned: false, bannedAt: undefined, banReason: undefined },
    { new: true }
  ).select("username email banned");

  if (!user) return res.status(404).json({ message: "User not found" });

  res.status(200).json({ message: "User unbanned", user });
};

// @desc    View a user's profile (for reviewing photos before removing one)
// @route   GET /api/admin/users/:userId/profile
// @access  Private/Admin
export const getUserProfile = async (req, res) => {
  const profile = await Profile.findOne({ user: req.params.userId })
    .select("name photos profileImage aboutMe verified")
    .lean();
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.status(200).json({ profile });
};

// @desc    Remove a photo from a user's profile (moderation action)
// @route   DELETE /api/admin/users/:userId/photo
// @access  Private/Admin
export const removeUserPhoto = async (req, res) => {
  const { userId } = req.params;
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Photo url is required" });

  const profile = await Profile.findOne({ user: userId });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  profile.photos = profile.photos.filter((p) => p !== url);
  if (profile.profileImage === url) {
    profile.profileImage = profile.photos[0] || "";
  }
  await profile.save();

  res.status(200).json({ message: "Photo removed", photos: profile.photos });
};
