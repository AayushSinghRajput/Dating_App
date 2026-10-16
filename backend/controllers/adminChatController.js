import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import Profile from "../models/profileModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

const PAGE_SIZE = 30;

// @desc    List all messages with search/filter for chat moderation
// @route   GET /api/admin/messages?search=&chatId=&type=&page=
// @access  Private/Admin
export const listMessages = async (req, res) => {
  const { search = "", chatId = "", type = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const filter = { deleted: { $ne: true } };
  if (chatId) filter.chat = chatId;
  if (type) filter.type = type;

  if (search.trim()) {
    filter.text = { $regex: search.trim(), $options: "i" };
  }

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .populate("sender", "username email")
      .populate({ path: "chat", select: "participants" })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Message.countDocuments(filter),
  ]);

  // Attach sender profile images
  const senderIds = [...new Set(messages.map((m) => m.sender?._id?.toString()).filter(Boolean))];
  const profiles = await Profile.find({ user: { $in: senderIds } })
    .select("user profileImage name")
    .lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const enriched = messages.map((m) => ({
    ...m,
    sender: {
      ...m.sender,
      profile: profileMap[m.sender?._id?.toString()] || null,
    },
  }));

  res.status(200).json({ messages: enriched, total, page: pageNum, pageSize: PAGE_SIZE });
};

// @desc    Admin delete a message for everyone
// @route   DELETE /api/admin/messages/:messageId
// @access  Private/Admin
export const adminDeleteMessage = async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });

  message.deleted = true;
  message.text = "";
  message.audio = undefined;
  message.media = undefined;
  await message.save();

  req.app.get("io")?.to(message.chat.toString()).emit("messageDeleted", {
    messageId: message._id,
    chatId: message.chat,
    mode: "everyone",
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_MESSAGE",
    targetId: messageId,
    targetType: "Message",
    details: { chatId: message.chat },
    req,
  });

  res.status(200).json({ message: "Message removed" });
};

// @desc    List all chats (conversations) for admin browsing
// @route   GET /api/admin/chats?page=
// @access  Private/Admin
export const listChats = async (req, res) => {
  const { page = "1", search = "" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const [chats, total] = await Promise.all([
    Chat.find({})
      .populate("participants", "username email")
      .populate("lastMessage", "text type createdAt sender")
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Chat.countDocuments({}),
  ]);

  res.status(200).json({ chats, total, page: pageNum, pageSize });
};
