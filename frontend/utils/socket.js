import { io } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

//optional helper functions
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (chatId) => {
  socket.emit("joinRoom", chatId);
};

export const sendMessage = (chatId, message) => {
  socket.emit("sendMessage", { chatId, message });
};
