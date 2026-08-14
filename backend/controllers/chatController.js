import mongoose from "mongoose";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
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

  // Batch-fetch unread counts (messages sent by the other participant that
  // this user hasn't read yet), one aggregation instead of one query per chat.
  // Aggregation pipelines skip Mongoose's automatic string->ObjectId casting
  // (unlike .find()/.updateMany()), so userId must be cast explicitly here.
  const chatIds = chats.map((c) => c._id);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const unreadCounts = await Message.aggregate([
    { $match: { chat: { $in: chatIds }, sender: { $ne: userObjectId }, read: false, deletedFor: { $ne: userObjectId } } },
    { $group: { _id: "$chat", count: { $sum: 1 } } },
  ]);
  const unreadByChat = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));

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
        unread: unreadByChat.get(chat._id.toString()) || 0,
      };
    })
    .filter(Boolean);

  res.status(200).json(chatList);
};

// @desc    Mark every unread message in a chat (from the other participant)
//          as read, and tell them live so read receipts can update.
// @route   PATCH /api/chats/:chatId/read
// @access  Private
export const markChatRead = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.participants.some((p) => p.toString() === userId)) {
    return res.status(404).json({ message: "Chat not found" });
  }

  await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, read: false },
    { read: true }
  );

  req.app.get("io")?.to(chatId).emit("messagesRead", { chatId, userId });

  res.status(200).json({ success: true });
};

// @desc    Total unread messages across all of the logged-in user's chats —
//          powers the Chat tab badge.
// @route   GET /api/chats/unread-count
// @access  Private
export const getUnreadChatsCount = async (req, res) => {
  const userId = req.user.id;

  const myChats = await Chat.find({ participants: userId }).select("_id").lean();
  const chatIds = myChats.map((c) => c._id);

  const count = await Message.countDocuments({
    chat: { $in: chatIds },
    sender: { $ne: userId },
    read: false,
    deletedFor: { $ne: userId },
  });

  res.status(200).json({ count });
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
