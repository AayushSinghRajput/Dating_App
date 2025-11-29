import Message from "../models/messageModel.js";

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a chat room
    socket.on("joinRoom", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
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
