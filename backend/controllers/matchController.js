import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import { sendNotification } from "../utils/notify.js";

/**
 * Like a profile
 * - Adds targetProfileId to likes[]
 * - If the target has already liked you, create a match
 */
export const likeProfile = async (req, res) => {
  try {
    const { targetProfileId } = req.body;
    const currentUserId = req.user.id; 
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!currentProfile)
      return res.status(404).json({ message: "Current profile not found" });

    if (currentProfile.likes.includes(targetProfileId)) {
      return res.status(200).json({ message: "Already liked this profile" });
    }

    // Add to likes
    currentProfile.likes.push(targetProfileId);
    await currentProfile.save();

    // Check if target also liked current user (mutual like = match)
    const targetProfile = await Profile.findById(targetProfileId);

    let isMatch = false;

    if (targetProfile && targetProfile.likes.includes(currentProfile._id)) {
      // Add to both matches array
      currentProfile.matches.addToSet(targetProfile._id);
      targetProfile.matches.addToSet(currentProfile._id);
      await currentProfile.save();
      await targetProfile.save();
      isMatch = true;
    }

    const io = req.app.get("io");
    if (targetProfile) {
      if (isMatch) {
        await Promise.all([
          sendNotification(io, { userId: targetProfile.user, type: "match", fromUserId: currentUserId }),
          sendNotification(io, { userId: currentUserId, type: "match", fromUserId: targetProfile.user }),
        ]);
      } else {
        await sendNotification(io, { userId: targetProfile.user, type: "like", fromUserId: currentUserId });
      }
    }

    res.status(200).json({
      message: isMatch ? "It's a Match! 🎉" : "Profile liked",
      match: isMatch,
    });
  } catch (error) {
    console.error("Error liking profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Pass a profile
 * - Adds targetProfileId to passes[]
 */
export const passProfile = async (req, res) => {
  try {
    const { targetProfileId } = req.body;
    const currentUserId = req.user.id;
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!currentProfile)
      return res.status(404).json({ message: "Current profile not found" });

    if (currentProfile.passes.includes(targetProfileId)) {
      return res.status(200).json({ message: "Already passed this profile" });
    }

    currentProfile.passes.push(targetProfileId);
    await currentProfile.save();

    res.status(200).json({ message: "Profile passed successfully" });
  } catch (error) {
    console.error("Error passing profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Unmatch a user
 * - Removes each other from likes[] and matches[]
 * - Deletes the chat and message history between them
 */
export const unmatchProfile = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error unmatching:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all matches for the logged-in user
 */
export const getMatches = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentProfile = await Profile.findOne({ user: currentUserId })
      .populate("matches", "user profileImage location age");

    if (!currentProfile)
      return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({
      matches: currentProfile.matches,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Server error" });
  }
};
