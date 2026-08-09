import Chat from "../models/chatModel.js";
import Profile from "../models/profileModel.js";
import { isBlockedEitherWay } from "../utils/block.js";

function previewForMessage(lastMsg) {
  if (!lastMsg) return "Say hi 👋";
  if (lastMsg.type === "audio") return "🎤 Voice message";
  if (lastMsg.type === "image") return "📷 Photo";
  if (lastMsg.type === "video") return "🎥 Video";
  if (lastMsg.type === "call") return "📞 Call";
  return lastMsg.text || "Say hi 👋";
}

export const getUserChats = async (req, res) => {
  const userId = req.user.id;
  const chats = await Chat.find({ participants: userId })
    .populate("participants", "username email")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  const otherUserByChat = new Map();
  const otherUserIds = [];
  for (const chat of chats) {
    const otherUser = chat.participants.find((p) => p && p._id.toString() !== userId);
    if (otherUser) {
      otherUserByChat.set(chat._id.toString(), otherUser);
      otherUserIds.push(otherUser._id);
    }
  }

  // Batch-fetch every other-participant's profile in one query instead of
  // one query per chat.
  const profiles = await Profile.find({ user: { $in: otherUserIds } })
    .select("user profileImage")
    .lean();
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  const chatList = chats
    .map((chat) => {
      const otherUser = otherUserByChat.get(chat._id.toString());
      if (!otherUser) return null; // stale chat with a missing/unresolvable participant

      const profile = profileByUserId.get(otherUser._id.toString());

      return {
        id: chat._id,
        otherUserId: otherUser._id,
        userName: otherUser.username,
        avatar: profile?.profileImage || "https://placehold.co/100x100",
        lastMessage: previewForMessage(chat.lastMessage),
        time: chat.lastMessage?.createdAt || chat.updatedAt,
        unread: 0,
      };
    })
    .filter(Boolean);

  res.status(200).json(chatList);
};

export const createOrGetChat = async (req, res) => {
  const { receiverId } = req.body;
  const userId = req.user.id;

  if (await isBlockedEitherWay(userId, receiverId)) {
    return res.status(403).json({ message: "You can't message this user." });
  }

  let chat = await Chat.findOne({ participants: { $all: [userId, receiverId] } });

  if (!chat) {
    chat = new Chat({ participants: [userId, receiverId] });
    await chat.save();
  }

  res.status(200).json(chat);
};
