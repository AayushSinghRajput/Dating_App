import Profile from "../models/profileModel.js";
import { sendNotification, retractNotification } from "../utils/notify.js";

// @desc    Toggle favorite user (add or remove)
// @route   POST /api/profile/:targetUserId/favorite
// @access  Private
export const toggleFavorite = async (req, res) => {
  const loggedInUserId = req.user.id;
  const { targetUserId } = req.params;

  if (loggedInUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot favorite yourself." });
  }

  const profile = await Profile.findOne({ user: loggedInUserId });
  if (!profile) return res.status(404).json({ message: "Profile not found for this user." });

  const isFavorite = profile.favorites.includes(targetUserId);

  if (isFavorite) {
    profile.favorites = profile.favorites.filter((id) => id.toString() !== targetUserId);
    await profile.save();

    await retractNotification(req.app.get("io"), {
      userId: targetUserId,
      fromUserId: loggedInUserId,
      type: "favorite",
    });

    return res.json({ message: "Removed from favorites", favorites: profile.favorites });
  }

  profile.favorites.push(targetUserId);
  await profile.save();

  await sendNotification(req.app.get("io"), {
    userId: targetUserId,
    type: "favorite",
    fromUserId: loggedInUserId,
  });

  res.json({ message: "Added to favorites", favorites: profile.favorites });
};

// @desc    Get all favorite users of the logged-in user
// @route   GET /api/profile/favorites
// @access  Private
export const getFavorites = async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).populate("favorites", "username email");
  if (!profile) return res.status(404).json({ message: "Profile not found for this user." });
  res.json({ favorites: profile.favorites });
};
