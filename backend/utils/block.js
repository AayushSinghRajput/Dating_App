import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

// True if either user has blocked the other.
export async function isBlockedEitherWay(userAId, userBId) {
  const [profileA, profileB] = await Promise.all([
    Profile.findOne({ user: userAId }).select("blockedUsers"),
    Profile.findOne({ user: userBId }).select("blockedUsers"),
  ]);

  const aBlockedB = profileA?.blockedUsers.some(
    (id) => id.toString() === userBId.toString()
  );
  const bBlockedA = profileB?.blockedUsers.some(
    (id) => id.toString() === userAId.toString()
  );

  return Boolean(aBlockedB || bBlockedA);
}

// Blocks targetUserId on behalf of userId: hides each other from discovery,
// breaks any existing match/like, and deletes their chat history. Shared by
// the explicit "Block" action and the auto-block that happens on "Report".
export async function performBlock(userId, targetUserId) {
  const [profile, targetProfile] = await Promise.all([
    Profile.findOne({ user: userId }),
    Profile.findOne({ user: targetUserId }),
  ]);

  if (!profile) {
    throw new Error("Profile not found for this user.");
  }

  if (!profile.blockedUsers.some((id) => id.toString() === targetUserId)) {
    profile.blockedUsers.push(targetUserId);
  }

  if (targetProfile) {
    profile.matches = profile.matches.filter(
      (id) => id.toString() !== targetProfile._id.toString()
    );
    profile.likes = profile.likes.filter(
      (id) => id.toString() !== targetProfile._id.toString()
    );
    targetProfile.matches = targetProfile.matches.filter(
      (id) => id.toString() !== profile._id.toString()
    );
    targetProfile.likes = targetProfile.likes.filter(
      (id) => id.toString() !== profile._id.toString()
    );
    await targetProfile.save();
  }

  await profile.save();

  const chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  });
  if (chat) {
    await Message.deleteMany({ chat: chat._id });
    await Chat.deleteOne({ _id: chat._id });
  }

  return profile.blockedUsers;
}
