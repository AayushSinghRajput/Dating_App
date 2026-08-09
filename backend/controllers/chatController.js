import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";
import { isBlockedEitherWay } from "../utils/block.js";

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const chatList = (
      await Promise.all(
        chats.map(async (chat) => {
          const otherUser = chat.participants.find(
            (p) => p && p._id.toString() !== userId
          );

          // Skip chats with a missing/unresolvable participant (e.g. stale data)
          if (!otherUser) return null;

          const profile = await Profile.findOne({ user: otherUser._id });

          const lastMsg = chat.lastMessage;
          let lastMessagePreview = "Say hi 👋";
          if (lastMsg) {
            if (lastMsg.type === "audio") lastMessagePreview = "🎤 Voice message";
            else if (lastMsg.type === "image") lastMessagePreview = "📷 Photo";
            else if (lastMsg.type === "video") lastMessagePreview = "🎥 Video";
            else if (lastMsg.type === "call") lastMessagePreview = "📞 Call";
            else lastMessagePreview = lastMsg.text || "Say hi 👋";
          }

          return {
            id: chat._id,
            otherUserId: otherUser._id,
            userName: otherUser.username,
            avatar: profile?.profileImage || "https://placehold.co/100x100",
            lastMessage: lastMessagePreview,
            time: chat.lastMessage?.createdAt || chat.updatedAt,
            unread: 0,
          };
        })
      )
    ).filter(Boolean);

    res.status(200).json(chatList);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: error.message || "Error fetching chats" });
  }
};

export const createOrGetChat = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const userId = req.user.id;

    if (await isBlockedEitherWay(userId, receiverId)) {
      return res.status(403).json({ message: "You can't message this user." });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, receiverId],
      });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat", error });
  }
};

// Populates sender info, updates the chat's last message, and broadcasts the
// saved message over the socket. Shared by text and voice message sends.
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

  await Chat.findByIdAndUpdate(newMessage.chat, {
    lastMessage: newMessage._id,
    updatedAt: new Date(),
  });

  req.app.get("io")?.to(newMessage.chat.toString()).emit("newMessage", messageWithProfile);

  return messageWithProfile;
}

export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user.id;

    if (!chatId || !text) {
      return res.status(400).json({ message: "Chat ID and text are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const otherParticipant = chat.participants.find((p) => p.toString() !== senderId);
    if (otherParticipant && (await isBlockedEitherWay(senderId, otherParticipant))) {
      return res.status(403).json({ message: "You can't message this user." });
    }

    const newMessage = await Message.create({
      chat: chatId,
      sender: senderId,
      text,
    });

    const messageWithProfile = await finalizeAndBroadcast(req, newMessage, senderId, {
      text: newMessage.text,
    });

    res.status(201).json(messageWithProfile);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error });
  }
};

export const sendVoiceMessage = async (req, res) => {
  try {
    const { chatId, duration } = req.body;
    const senderId = req.user.id;

    if (!chatId || !req.file) {
      return res.status(400).json({ message: "Chat ID and an audio file are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const otherParticipant = chat.participants.find((p) => p.toString() !== senderId);
    if (otherParticipant && (await isBlockedEitherWay(senderId, otherParticipant))) {
      return res.status(403).json({ message: "You can't message this user." });
    }

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
  } catch (error) {
    console.error("Error sending voice message:", error);
    res.status(500).json({ message: "Error sending voice message", error });
  }
};

export const sendMediaMessage = async (req, res) => {
  try {
    const { chatId } = req.body;
    const senderId = req.user.id;

    if (!chatId || !req.file) {
      return res.status(400).json({ message: "Chat ID and a media file are required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    const otherParticipant = chat.participants.find((p) => p.toString() !== senderId);
    if (otherParticipant && (await isBlockedEitherWay(senderId, otherParticipant))) {
      return res.status(403).json({ message: "You can't message this user." });
    }

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
  } catch (error) {
    console.error("Error sending media message:", error);
    res.status(500).json({ message: "Error sending media message", error });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    if (!chatId) {
      return res.status(400).json({
        message: "Chat ID is required.",
      });
    }
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username")
      .sort({ createdAt: 1 });

    const messagesWithProfile = await Promise.all(
      messages.map(async (msg) => {
        const profile = await Profile.findOne({
          user: msg.sender._id,
        }).select("profileImage");
        return {
          ...msg.toObject(),
          sender: {
            ...msg.sender.toObject(),
            profileImage: profile?.profileImage || "",
          },
          isFromMe: msg.sender._id.toString() === userId,
        };
      })
    );
    res.status(200).json(messagesWithProfile);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages", error });
  }
};
