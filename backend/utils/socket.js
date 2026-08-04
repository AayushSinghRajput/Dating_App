import jwt from "jsonwebtoken";
import Message from "../models/messageModel.js";
import Profile from "../models/profileModel.js";

const setupSocket = (io) => {
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

    // Join a chat room
    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    });

    // ---- Call signaling (pure relay, no persistence) ----
    socket.on("callUser", async ({ toUserId, chatId, callType, offer }) => {
      try {
        const callerProfile = await Profile.findOne({ user: socket.userId }).select(
          "name profileImage"
        );
        io.to(toUserId).emit("incomingCall", {
          fromUserId: socket.userId,
          fromName: callerProfile?.name || "Someone",
          fromAvatar: callerProfile?.profileImage || "",
          chatId,
          callType,
          offer,
        });
      } catch (err) {
        console.error("Error relaying callUser:", err);
      }
    });

    socket.on("answerCall", ({ toUserId, answer }) => {
      io.to(toUserId).emit("callAnswered", { answer });
    });

    socket.on("iceCandidate", ({ toUserId, candidate }) => {
      io.to(toUserId).emit("iceCandidate", { candidate });
    });

    socket.on("rejectCall", ({ toUserId }) => {
      io.to(toUserId).emit("callRejected");
    });

    socket.on("endCall", ({ toUserId }) => {
      io.to(toUserId).emit("callEnded");
    });

    // Send message
    socket.on("sendMessage", async ({ chatId, message }) => {
      try {
        const newMessage = new Message({
          chat: message.chatId,
          sender: message.senderId,
          text: message.text,
          read: false,
        });

        const savedMessage = await newMessage.save();

        // Populate sender info (optional)
        await savedMessage.populate("sender", "username avatar");

        // Emit to all clients in the same room
        io.to(chatId).emit("newMessage", savedMessage);
      } catch (err) {
        console.error("Error saving message:", err);
      }
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
