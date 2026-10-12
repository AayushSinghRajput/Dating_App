import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";
import { destroyCloudinaryAssets } from "../utils/cloudinaryHelper.js";

// @desc    Get the logged-in user's basic account info
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "username email emailVerified isPremium premiumExpiresAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};

// @desc    Permanently delete the logged-in user's account and all associated data
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
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

  // Collect all user-associated Cloudinary media URLs for cleanup
  const mediaUrlsToDelete = [];
  if (profile) {
    if (profile.profileImage) mediaUrlsToDelete.push(profile.profileImage);
    if (Array.isArray(profile.photos)) mediaUrlsToDelete.push(...profile.photos);
    if (profile.verificationPhoto) mediaUrlsToDelete.push(profile.verificationPhoto);
  }

  // Find any audio or media messages uploaded by this user
  const userMediaMessages = await Message.find({
    sender: userId,
    $or: [{ "audio.url": { $exists: true } }, { "media.url": { $exists: true } }],
  }).select("audio.url media.url").lean();

  userMediaMessages.forEach((m) => {
    if (m.audio?.url) mediaUrlsToDelete.push(m.audio.url);
    if (m.media?.url) mediaUrlsToDelete.push(m.media.url);
  });

  if (profile) {
    // Scrub this profile out of everyone else's likes/passes/matches/favorites.
    // Filtering to docs that actually reference it (rather than an
    // unconditional {} match) lets Mongo use the `likes` index instead of
    // scanning the whole collection.
    await Profile.updateMany(
      {
        $or: [
          { likes: profile._id },
          { passes: profile._id },
          { matches: profile._id },
          { favorites: userId },
        ],
      },
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

  // Asynchronously destroy Cloudinary assets in the background to prevent orphaned storage
  if (mediaUrlsToDelete.length > 0) {
    destroyCloudinaryAssets(mediaUrlsToDelete).catch((err) => {
      console.error("[Account Deletion] Background Cloudinary cleanup failed:", err);
    });
  }

  res.status(200).json({ message: "Account deleted successfully" });
};
