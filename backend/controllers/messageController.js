import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";
import { isBlockedEitherWay } from "../utils/block.js";
import { containsBannedContent } from "../utils/moderation.js";
import { logEvent } from "../services/recommendation/eventLogger.js";

const DEFAULT_MESSAGE_LIMIT = 100;
const MAX_MESSAGE_LIMIT = 200;
// "Sustained conversation" (Section 20/28) — a rough proxy for real
// back-and-forth rather than a one-off exchange. Fires once per chat, the
// first time it's crossed with messages from both sides (not just one
// person sending several in a row).
const SUSTAINED_CONVERSATION_THRESHOLD = 6;

function previewForMessage(extraFields) {
  if (extraFields.type === "audio") return "🎤 Voice message";
  if (extraFields.type === "image") return "📷 Photo";
  if (extraFields.type === "video") return "🎥 Video";
  return extraFields.text || "New message";
}

// Section 20/28 — deeper funnel signals than a raw MESSAGE_SENT: did this
// message actually reply to the other person, and has the conversation
// sustained itself past a first exchange? Both are stronger evidence of a
// good recommendation than a like/match alone (Section 28).
async function logConversationEvents(chatId, senderId, receiverId, newMessageId) {
  const [priorMessage] = await Message.find({ chat: chatId, _id: { $ne: newMessageId } })
    .sort({ createdAt: -1 })
    .limit(1)
    .select("sender");
  if (priorMessage && priorMessage.sender.toString() === receiverId.toString()) {
    logEvent(senderId, receiverId, "MESSAGE_REPLIED");
  }

  const messageCount = await Message.countDocuments({ chat: chatId });
  if (messageCount === SUSTAINED_CONVERSATION_THRESHOLD) {
    const distinctSenders = await Message.distinct("sender", { chat: chatId });
    if (distinctSenders.length >= 2) {
      logEvent(senderId, receiverId, "SUSTAINED_CONVERSATION");
      logEvent(receiverId, senderId, "SUSTAINED_CONVERSATION");
    }
  }
}

// Populates sender info, updates the chat's last message, and broadcasts the
// saved message over the socket. Shared by text, voice, and media sends.
async function finalizeAndBroadcast(req, newMessage, senderId, extraFields = {}) {
  await newMessage.populate("sender", "username email");

  const profile = await Profile.findOne({ user: senderId }).select("profileImage");
  const messageWithProfile = {
    _id: newMessage._id,
    chat: newMessage.chat,
    createdAt: newMessage.createdAt,
    sender: {
      _id: newMessage.sender._id,
      username: newMessage.sender.username,
      profileImage: profile?.profileImage || "",
    },
    ...extraFields,
  };

  const chat = await Chat.findByIdAndUpdate(
    newMessage.chat,
    { lastMessage: newMessage._id, updatedAt: new Date() },
    { new: true }
  ).select("participants");

  const io = req.app.get("io");
  io?.to(newMessage.chat.toString()).emit("newMessage", messageWithProfile);

  // Also notify the OTHER participant's personal room directly — the room
  // above only reaches sockets currently joined to this specific chat
  // screen, so someone elsewhere in the app (or just connected, not viewing
  // this chat) would otherwise get no live signal at all.
  const receiverId = chat?.participants.find((p) => p.toString() !== senderId.toString());
  if (receiverId) {
    io?.to(receiverId.toString()).emit("newMessagePreview", {
      chatId: newMessage.chat,
      senderId,
      senderName: newMessage.sender.username,
      senderAvatar: profile?.profileImage || "",
      preview: previewForMessage(extraFields),
      createdAt: newMessage.createdAt,
    });
    logEvent(senderId, receiverId, "MESSAGE_SENT");
    logConversationEvents(newMessage.chat, senderId, receiverId, newMessage._id);
  }

  return messageWithProfile;
}

async function assertCanMessage(chatId, senderId) {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    const err = new Error("Chat not found");
    err.status = 404;
    throw err;
  }
  const otherParticipant = chat.participants.find((p) => p.toString() !== senderId);
  if (otherParticipant && (await isBlockedEitherWay(senderId, otherParticipant))) {
    const err = new Error("You can't message this user.");
    err.status = 403;
    throw err;
  }
  return chat;
}

export const sendMessage = async (req, res) => {
  const { chatId, text } = req.body;
  const senderId = req.user.id;

  if (!chatId || !text) {
    return res.status(400).json({ message: "Chat ID and text are required" });
  }
  if (containsBannedContent(text)) {
    return res.status(400).json({ message: "Your message was blocked by our content filter." });
  }

  await assertCanMessage(chatId, senderId);

  const newMessage = await Message.create({ chat: chatId, sender: senderId, text });
  const messageWithProfile = await finalizeAndBroadcast(req, newMessage, senderId, { text: newMessage.text });

  res.status(201).json(messageWithProfile);
};

export const sendVoiceMessage = async (req, res) => {
  const { chatId, duration } = req.body;
  const senderId = req.user.id;

  if (!chatId || !req.file) {
    return res.status(400).json({ message: "Chat ID and an audio file are required" });
  }

  await assertCanMessage(chatId, senderId);

  const newMessage = await Message.create({
    chat: chatId,
    sender: senderId,
    type: "audio",
    audio: { url: req.file.path, duration: Number(duration) || 0 },
  });

  const messageWithProfile = await finalizeAndBroadcast(req, newMessage, senderId, {
    type: "audio",
    audio: newMessage.audio,
  });

  res.status(201).json(messageWithProfile);
};

export const sendMediaMessage = async (req, res) => {
  const { chatId } = req.body;
  const senderId = req.user.id;

  if (!chatId || !req.file) {
    return res.status(400).json({ message: "Chat ID and a media file are required" });
  }

  await assertCanMessage(chatId, senderId);

  const messageType = req.file.mimetype?.startsWith("video/") ? "video" : "image";

  const newMessage = await Message.create({
    chat: chatId,
    sender: senderId,
    type: messageType,
    media: { url: req.file.path },
  });

  const messageWithProfile = await finalizeAndBroadcast(req, newMessage, senderId, {
    type: messageType,
    media: newMessage.media,
  });

  res.status(201).json(messageWithProfile);
};

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const { mode } = req.body; // "me" | "everyone"
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });

  const chat = await Chat.findById(message.chat);
  if (!chat || !chat.participants.some((p) => p.toString() === userId)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  if (mode === "everyone") {
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Only the sender can delete for everyone" });
    }
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
  } else {
    if (!message.deletedFor.some((id) => id.toString() === userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }
    req.app.get("io")?.to(userId).emit("messageDeleted", {
      messageId: message._id,
      chatId: message.chat,
      mode: "me",
    });
  }

  res.status(200).json({ message: "Message deleted" });
};

// @route GET /api/chats/:chatId/messages?limit=&before=
// Returns the most recent `limit` messages (oldest-first), optionally before
// a given timestamp for loading older history — bounded by default instead
// of returning a chat's entire lifetime history on every open.
export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required." });
  }

  const filter = { chat: chatId, deletedFor: { $ne: userId } };
  if (req.query.before) {
    const beforeDate = new Date(req.query.before);
    if (!Number.isNaN(beforeDate.getTime())) {
      filter.createdAt = { $lt: beforeDate };
    }
  }

  const limit = Math.min(
    MAX_MESSAGE_LIMIT,
    Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_MESSAGE_LIMIT)
  );

  const messages = await Message.find(filter)
    .populate("sender", "username")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  messages.reverse();

  // Batch-fetch every sender's profile in one query instead of one query
  // per message.
  const senderIds = [...new Set(messages.map((m) => m.sender._id.toString()))];
  const profiles = await Profile.find({ user: { $in: senderIds } }).select("user profileImage").lean();
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  const messagesWithProfile = messages.map((msg) => ({
    ...msg,
    sender: {
      ...msg.sender,
      profileImage: profileByUserId.get(msg.sender._id.toString())?.profileImage || "",
    },
    isFromMe: msg.sender._id.toString() === userId,
  }));

  res.status(200).json(messagesWithProfile);
};
