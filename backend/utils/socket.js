import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import { sendNotification } from "./notify.js";
import { isBlockedEitherWay } from "./block.js";

const setupSocket = (io) => {
  // callId -> { chatId, callerId, calleeId, callType, startedAt, answeredAt }
  const activeCalls = new Map();

  async function finalizeCall(callId, status) {
    const call = activeCalls.get(callId);
    if (!call) return;
    activeCalls.delete(callId);

    const duration =
      status === "answered" && call.answeredAt
        ? Math.round((Date.now() - call.answeredAt) / 1000)
        : 0;

    try {
      const message = await Message.create({
        chat: call.chatId,
        sender: call.callerId,
        type: "call",
        call: { callType: call.callType, status, duration, caller: call.callerId },
      });

      const [caller, callerProfile] = await Promise.all([
        User.findById(call.callerId).select("username"),
        Profile.findOne({ user: call.callerId }).select("profileImage"),
      ]);

      const payload = {
        _id: message._id,
        chat: message.chat,
        type: "call",
        call: message.call,
        createdAt: message.createdAt,
        sender: {
          _id: call.callerId,
          username: caller?.username || "Unknown",
          profileImage: callerProfile?.profileImage || "",
        },
      };

      await Chat.findByIdAndUpdate(call.chatId, {
        lastMessage: message._id,
        updatedAt: new Date(),
      });

      io.to(call.chatId).emit("newMessage", payload);

      if (status === "missed") {
        await sendNotification(io, {
          userId: call.calleeId,
          type: "missed_call",
          fromUserId: call.callerId,
          chat: call.chatId,
          callType: call.callType,
        });
      }
    } catch (err) {
      console.error("Error saving call-log message:", err);
    }
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "user:", socket.userId);

    // Personal room so this user can be reached directly (e.g. for calls)
    socket.join(socket.userId);

    // Best-effort DAU/retention signal — a socket connection means the app was opened.
    User.findByIdAndUpdate(socket.userId, { lastActiveAt: new Date() }).catch(() => {});

    // Join a chat room
    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    });

    // ---- Call signaling (relay + call-log persistence) ----
    socket.on("callUser", async ({ toUserId, chatId, callType, offer, callId }) => {
      try {
        if (await isBlockedEitherWay(socket.userId, toUserId)) {
          return;
        }

        const [caller, callerProfile] = await Promise.all([
          User.findById(socket.userId).select("username"),
          Profile.findOne({ user: socket.userId }).select("profileImage"),
        ]);

        activeCalls.set(callId, {
          chatId,
          callerId: socket.userId,
          calleeId: toUserId,
          callType,
          startedAt: Date.now(),
          answeredAt: null,
        });

        io.to(toUserId).emit("incomingCall", {
          fromUserId: socket.userId,
          fromName: caller?.username || "Someone",
          fromAvatar: callerProfile?.profileImage || "",
          chatId,
          callType,
          offer,
          callId,
        });
      } catch (err) {
        console.error("Error relaying callUser:", err);
      }
    });

    socket.on("answerCall", ({ toUserId, answer, callId }) => {
      const call = activeCalls.get(callId);
      if (call) call.answeredAt = Date.now();
      io.to(toUserId).emit("callAnswered", { answer });
    });

    socket.on("iceCandidate", ({ toUserId, candidate }) => {
      io.to(toUserId).emit("iceCandidate", { candidate });
    });

    socket.on("rejectCall", ({ toUserId, callId }) => {
      io.to(toUserId).emit("callRejected");
      finalizeCall(callId, "rejected");
    });

    socket.on("endCall", ({ toUserId, callId }) => {
      io.to(toUserId).emit("callEnded");
      const call = activeCalls.get(callId);
      finalizeCall(callId, call?.answeredAt ? "answered" : "missed");
    });

    // Typing indicator (relayed only to other participants in the room)
    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("userTyping", { chatId, userId: socket.userId });
    });

    socket.on("stopTyping", ({ chatId }) => {
      socket.to(chatId).emit("userStoppedTyping", { chatId, userId: socket.userId });
    });

    // Mark messages as read
    socket.on("markAsRead", async ({ chatId, userId }) => {
      try {
        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, read: false },
          { read: true }
        );
        io.to(chatId).emit("messagesRead", { chatId, userId });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export default setupSocket;
