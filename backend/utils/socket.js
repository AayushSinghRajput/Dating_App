import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import { sendNotification } from "./notify.js";
import { isBlockedEitherWay } from "./block.js";
import { sendPushToUser } from "../services/pushNotificationService.js";

// Global online users tracker: userId (string) -> Set of socketIds
const onlineUsers = new Map();

export const isUserOnline = (userId) => {
  if (!userId) return false;
  const sockets = onlineUsers.get(userId.toString());
  return Boolean(sockets && sockets.size > 0);
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};

// Global active calls tracker: callId -> { chatId, callerId, calleeId, callType, startedAt, answeredAt }
const activeCalls = new Map();

export async function finalizeCall(io, callId, status) {
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

    if (io) {
      io.to(call.chatId).emit("newMessage", payload);
    }

    if (status === "missed" && io) {
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

export const rejectActiveCall = async (io, callId, optionalCallerId, optionalCalleeId) => {
  const call = activeCalls.get(callId);
  // Caller is the initiator of the call who must be notified that the receiver declined
  const targetCallerId = (call && call.callerId) ? call.callerId.toString() : (optionalCallerId ? optionalCallerId.toString() : null);
  const targetCalleeId = (call && call.calleeId) ? call.calleeId.toString() : (optionalCalleeId ? optionalCalleeId.toString() : null);

  console.log(`[Socket] Call ${callId} declined. Notifying caller: ${targetCallerId}, callee: ${targetCalleeId}`);

  if (io && targetCallerId) {
    io.to(targetCallerId).emit("callRejected", { callId });
  }
  if (io && targetCalleeId) {
    io.to(targetCalleeId).emit("callRejected", { callId });
  }
  if (io && call?.chatId) {
    io.to(call.chatId).emit("callRejected", { callId });
  }

  await finalizeCall(io, callId, "rejected");

  if (targetCallerId) {
    sendPushToUser(targetCallerId, {
      title: "Call declined",
      body: "The call was declined",
      data: {
        type: "call_rejected",
        callId,
      },
      channelId: "voip_calls_v4",
      priority: "high",
    }).catch(() => {});
  }
  if (targetCalleeId) {
    sendPushToUser(targetCalleeId, {
      title: "Call declined",
      body: "The call was declined",
      data: {
        type: "call_rejected",
        callId,
      },
      channelId: "voip_calls_v4",
      priority: "high",
    }).catch(() => {});
  }
};

const setupSocket = (io) => {

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id ? decoded.id.toString() : null;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log("User connected:", socket.id, "user:", userId);

    if (userId) {
      // Personal room so this user can be reached directly (e.g. for calls)
      socket.join(userId);

      const existingSockets = onlineUsers.get(userId) || new Set();
      const wasOffline = existingSockets.size === 0;
      existingSockets.add(socket.id);
      onlineUsers.set(userId, existingSockets);

      // Best-effort DAU/retention signal — a socket connection means the app was opened.
      User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).catch(() => {});

      // Send the current list of online user IDs to the newly connected user
      socket.emit("onlineUsers", Array.from(onlineUsers.keys()));

      // Broadcast to all other users that this user came online
      if (wasOffline) {
        socket.broadcast.emit("userOnline", { userId });
      }
    }

    // Allow clients to query the current list of online users on demand
    socket.on("getOnlineUsers", () => {
      socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

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
          offer,
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

        // Send high-priority push notification so the call rings when app is closed / locked
        sendPushToUser(toUserId, {
          title: `Incoming ${callType === "video" ? "Video" : "Audio"} Call`,
          body: `${caller?.username || "Someone"} is calling you...`,
          data: {
            type: "incoming_call",
            callId,
            chatId,
            callType,
            fromUserId: socket.userId,
            fromName: caller?.username || "Someone",
            fromAvatar: callerProfile?.profileImage || "",
            offer,
          },
          channelId: "voip_calls_v4",
          categoryId: "incoming_call",
          priority: "high",
          sticky: true,
        }).catch((err) => console.error("Error sending incoming call push:", err));
      } catch (err) {
        console.error("Error relaying callUser:", err);
      }
    });

    socket.on("checkCallStatus", ({ callId }, callback) => {
      const call = activeCalls.get(callId);
      if (typeof callback === "function") {
        callback({
          active: Boolean(call),
          answered: Boolean(call?.answeredAt),
          call: call || null,
        });
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

    socket.on("rejectCall", async ({ toUserId, callId }) => {
      await rejectActiveCall(io, callId, toUserId);
    });

    socket.on("endCall", async ({ toUserId, callId }) => {
      const call = activeCalls.get(callId);
      const otherUserId = toUserId || (call ? (call.callerId.toString() === socket.userId ? call.calleeId : call.callerId) : null);

      if (otherUserId) {
        io.to(otherUserId.toString()).emit("callEnded", { callId });
      }
      if (call?.chatId) {
        io.to(call.chatId).emit("callEnded", { callId });
      }

      await finalizeCall(io, callId, call?.answeredAt ? "answered" : "missed");

      if (otherUserId) {
        sendPushToUser(otherUserId.toString(), {
          title: "Call ended",
          body: "The call has ended",
          data: {
            type: "call_ended",
            callId,
          },
          channelId: "voip_calls_v4",
          priority: "high",
        }).catch(() => {});
      }
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
      console.log("User disconnected:", socket.id, "user:", userId);
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            User.findByIdAndUpdate(userId, { lastActiveAt: new Date() }).catch(() => {});
            socket.broadcast.emit("userOffline", { userId });
          }
        }
      }
    });
  });
};

export default setupSocket;
