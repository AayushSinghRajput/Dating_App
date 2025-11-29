import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";

export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username email")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const chatList = await Promise.all(
      chats.map(async (chat) => {
        const otherUser = chat.participants.find(
          (p) => p._id.toString() !== userId
        );

        const profile = await Profile.findOne({ user: otherUser._id });

        return {
          id: chat._id,
          userName: otherUser.username,
          avatar: profile?.profileImage || "https://placehold.co/100x100",
          lastMessage: chat.lastMessage?.text || "Say hi 👋",
          time: chat.lastMessage?.createdAt || chat.updatedAt,
          unread: 0,
        };
      })
    );

    res.status(200).json(chatList);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Error fetching chats", error });
  }
};

export const createOrGetChat = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const userId = req.user.id;

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

export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const senderId = req.user.id;

    if (!chatId || !text) {
      return res.status(400).json({ message: "Chat ID and text are required" });
    }

    const newMessage = await Message.create({
      chat: chatId,
      sender: senderId,
      text,
    });
    //populate sender fields
    await newMessage.populate("sender", "username email");

    
    //fetch sender profile manually
    const profile = await Profile.findOne({
      user: senderId,
    }).select("profileImage");
    const messagewithProfile = {
      _id: newMessage._id,
      chat: newMessage.chat,
      text: newMessage.text,
      createdAt: newMessage.createdAt,
      sender: {
        _id: newMessage.sender._id,
        username: newMessage.sender.username,
        profileImage: profile?.profileImage || "",
      },
    };
    //update the chat's last message
    const chat = await Chat.findById(chatId);
    if (chat) {
      chat.lastMessage = newMessage._id;
      chat.updatedAt = new Date();
      await chat.save();
    }
    res.status(201).json(messagewithProfile);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error });
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
