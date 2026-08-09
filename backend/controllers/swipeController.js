import Profile from "../models/profileModel.js";
import { sendNotification } from "../utils/notify.js";
import {
  isUserPremium,
  resetIfNewDay,
  FREE_DAILY_LIKES,
  FREE_DAILY_SUPER_LIKES,
  PREMIUM_DAILY_SUPER_LIKES,
} from "../utils/premium.js";

// Shared by likeProfile/superLikeProfile: adds the mutual-match check,
// records it on lastSwipe (for rewind), and fires the right notification.
async function finalizeLike(req, currentProfile, targetProfileId, notificationType) {
  const targetProfile = await Profile.findById(targetProfileId);
  let isMatch = false;

  if (targetProfile && targetProfile.likes.includes(currentProfile._id)) {
    currentProfile.matches.addToSet(targetProfile._id);
    targetProfile.matches.addToSet(currentProfile._id);
    currentProfile.lastSwipe.matched = true;
    await currentProfile.save();
    await targetProfile.save();
    isMatch = true;
  }

  const io = req.app.get("io");
  const currentUserId = currentProfile.user;
  if (targetProfile) {
    if (isMatch) {
      await Promise.all([
        sendNotification(io, { userId: targetProfile.user, type: "match", fromUserId: currentUserId }),
        sendNotification(io, { userId: currentUserId, type: "match", fromUserId: targetProfile.user }),
      ]);
    } else {
      await sendNotification(io, { userId: targetProfile.user, type: notificationType, fromUserId: currentUserId });
    }
  }

  return isMatch;
}

/**
 * Like a profile
 * - Adds targetProfileId to likes[]
 * - If the target has already liked you, create a match
 * - Free accounts are capped at FREE_DAILY_LIKES per day; Premium is unlimited
 */
export const likeProfile = async (req, res) => {
  const { targetProfileId } = req.body;
  const currentUserId = req.user.id;
  const currentProfile = await Profile.findOne({ user: currentUserId });

  if (!currentProfile) return res.status(404).json({ message: "Current profile not found" });

  if (currentProfile.likes.includes(targetProfileId)) {
    return res.status(200).json({ message: "Already liked this profile" });
  }

  const premium = await isUserPremium(currentUserId);
  resetIfNewDay(currentProfile, "likesUsedToday", "likesDate");
  if (!premium && currentProfile.likesUsedToday >= FREE_DAILY_LIKES) {
    return res.status(403).json({
      message: `You've used all ${FREE_DAILY_LIKES} free likes for today. Upgrade to Premium for unlimited likes.`,
      limitReached: true,
    });
  }
  currentProfile.likesUsedToday += 1;

  currentProfile.likes.push(targetProfileId);
  currentProfile.lastSwipe = {
    targetProfile: targetProfileId,
    action: "like",
    matched: false,
    swipedAt: new Date(),
  };
  await currentProfile.save();

  const isMatch = await finalizeLike(req, currentProfile, targetProfileId, "like");

  res.status(200).json({
    message: isMatch ? "It's a Match! 🎉" : "Profile liked",
    match: isMatch,
  });
};

/**
 * Super Like a profile
 * - Counts as a regular like (for matching) plus flags it in superLikes[]
 * - Sends a distinct "super_like" notification (unless it's already a match)
 * - Limited per day: FREE_DAILY_SUPER_LIKES for free accounts, more for Premium
 */
export const superLikeProfile = async (req, res) => {
  const { targetProfileId } = req.body;
  const currentUserId = req.user.id;
  const currentProfile = await Profile.findOne({ user: currentUserId });

  if (!currentProfile) return res.status(404).json({ message: "Current profile not found" });

  const premium = await isUserPremium(currentUserId);
  const dailyLimit = premium ? PREMIUM_DAILY_SUPER_LIKES : FREE_DAILY_SUPER_LIKES;
  resetIfNewDay(currentProfile, "superLikesUsedToday", "superLikesDate");

  if (currentProfile.superLikesUsedToday >= dailyLimit) {
    return res.status(403).json({
      message: premium
        ? "You've used all your Super Likes for today. More unlock tomorrow."
        : "You're out of Super Likes for today. Upgrade to Premium for more.",
      limitReached: true,
    });
  }

  const alreadyLiked = currentProfile.likes.includes(targetProfileId);
  currentProfile.superLikesUsedToday += 1;
  if (!alreadyLiked) {
    currentProfile.likes.push(targetProfileId);
  }
  currentProfile.superLikes.addToSet(targetProfileId);
  currentProfile.lastSwipe = {
    targetProfile: targetProfileId,
    action: "like",
    matched: false,
    swipedAt: new Date(),
  };
  await currentProfile.save();

  const isMatch = await finalizeLike(req, currentProfile, targetProfileId, "super_like");

  res.status(200).json({
    message: isMatch ? "It's a Match! 🎉" : "Super Like sent ⭐",
    match: isMatch,
  });
};

/**
 * Pass a profile
 * - Adds targetProfileId to passes[]
 */
export const passProfile = async (req, res) => {
  const { targetProfileId } = req.body;
  const currentUserId = req.user.id;
  const currentProfile = await Profile.findOne({ user: currentUserId });

  if (!currentProfile) return res.status(404).json({ message: "Current profile not found" });

  if (currentProfile.passes.includes(targetProfileId)) {
    return res.status(200).json({ message: "Already passed this profile" });
  }

  currentProfile.passes.push(targetProfileId);
  currentProfile.lastSwipe = {
    targetProfile: targetProfileId,
    action: "pass",
    matched: false,
    swipedAt: new Date(),
  };
  await currentProfile.save();

  res.status(200).json({ message: "Profile passed successfully" });
};

/**
 * Rewind (undo) the logged-in user's most recent swipe.
 * - Premium-only feature
 * - Only the single most recent swipe can be undone
 * - If it had created a match, the match is broken on both sides
 */
export const rewindLastSwipe = async (req, res) => {
  const currentUserId = req.user.id;

  const premium = await isUserPremium(currentUserId);
  if (!premium) {
    return res.status(403).json({
      message: "Rewind is a Premium feature. Upgrade to undo your last swipe.",
    });
  }

  const currentProfile = await Profile.findOne({ user: currentUserId });
  if (!currentProfile) return res.status(404).json({ message: "Profile not found" });

  const lastSwipe = currentProfile.lastSwipe;
  if (!lastSwipe?.targetProfile) {
    return res.status(400).json({ message: "No recent swipe to rewind" });
  }

  const targetId = lastSwipe.targetProfile.toString();

  if (lastSwipe.action === "pass") {
    currentProfile.passes = currentProfile.passes.filter((id) => id.toString() !== targetId);
  } else if (lastSwipe.action === "like") {
    currentProfile.likes = currentProfile.likes.filter((id) => id.toString() !== targetId);
    currentProfile.superLikes = currentProfile.superLikes.filter((id) => id.toString() !== targetId);

    if (lastSwipe.matched) {
      const targetProfile = await Profile.findById(targetId);
      if (targetProfile) {
        targetProfile.matches = targetProfile.matches.filter(
          (id) => id.toString() !== currentProfile._id.toString()
        );
        await targetProfile.save();
        req.app.get("io")?.to(targetProfile.user.toString()).emit("unmatched", {
          byUserId: currentUserId,
        });
      }
      currentProfile.matches = currentProfile.matches.filter((id) => id.toString() !== targetId);
    }
  }

  currentProfile.lastSwipe = undefined;
  await currentProfile.save();

  res.status(200).json({ message: "Last swipe rewound", targetProfileId: targetId });
};
