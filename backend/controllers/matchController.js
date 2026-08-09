import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

/**
 * Unmatch a user
 * - Removes each other from likes[] and matches[]
 * - Deletes the chat and message history between them
 */
export const unmatchProfile = async (req, res) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user.id;

  if (!targetUserId) {
    return res.status(400).json({ message: "targetUserId is required" });
  }

  const [currentProfile, targetProfile] = await Promise.all([
    Profile.findOne({ user: currentUserId }),
    Profile.findOne({ user: targetUserId }),
  ]);

  if (!currentProfile || !targetProfile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  currentProfile.matches = currentProfile.matches.filter(
    (id) => id.toString() !== targetProfile._id.toString()
  );
  currentProfile.likes = currentProfile.likes.filter(
    (id) => id.toString() !== targetProfile._id.toString()
  );
  targetProfile.matches = targetProfile.matches.filter(
    (id) => id.toString() !== currentProfile._id.toString()
  );
  targetProfile.likes = targetProfile.likes.filter(
    (id) => id.toString() !== currentProfile._id.toString()
  );

  await Promise.all([currentProfile.save(), targetProfile.save()]);

  const chat = await Chat.findOne({
    participants: { $all: [currentUserId, targetUserId] },
  });

  if (chat) {
    await Message.deleteMany({ chat: chat._id });
    await Chat.findByIdAndDelete(chat._id);
  }

  req.app.get("io")?.to(targetUserId).emit("unmatched", {
    byUserId: currentUserId,
    chatId: chat?._id,
  });

  res.status(200).json({ message: "Unmatched successfully" });
};

/**
 * Get profiles that have liked the current user but aren't matched yet
 */
export const getLikedByProfiles = async (req, res) => {
  const currentUserId = req.user.id;
  const currentProfile = await Profile.findOne({ user: currentUserId });

  if (!currentProfile) return res.status(404).json({ message: "Profile not found" });

  const blockedByMe = (currentProfile.blockedUsers || []).map((id) => id.toString());

  const likedByProfiles = await Profile.find({
    likes: currentProfile._id,
    _id: { $nin: currentProfile.matches },
  }).populate("user", "username");

  const visible = likedByProfiles.filter((p) => {
    const otherUserId = p.user?._id?.toString();
    if (!otherUserId) return false;
    const iBlockedThem = blockedByMe.includes(otherUserId);
    const theyBlockedMe = p.blockedUsers.some((id) => id.toString() === currentUserId);
    return !iBlockedThem && !theyBlockedMe;
  });

  const profiles = visible.map((p) => ({
    id: p._id,
    userId: p.user?._id,
    name: p.name || p.user?.username,
    age: p.age,
    profileImage: p.profileImage,
    location: p.location,
    isSuperLike: p.superLikes.some((id) => id.toString() === currentProfile._id.toString()),
  }));

  res.status(200).json({ profiles });
};

/**
 * Get all matches for the logged-in user
 */
export const getMatches = async (req, res) => {
  const currentUserId = req.user.id;
  const currentProfile = await Profile.findOne({ user: currentUserId }).populate(
    "matches",
    "user profileImage location age"
  );

  if (!currentProfile) return res.status(404).json({ message: "Profile not found" });

  res.status(200).json({ matches: currentProfile.matches });
};
