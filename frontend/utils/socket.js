import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

//optional helper functions
export const connectSocket = async () => {
  if (socket.connected) return;
  const token = await AsyncStorage.getItem("token");
  if (!token) return;
  socket.auth = { token };
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (chatId) => {
  socket.emit("joinRoom", chatId);
};

export const emitTyping = (chatId) => {
  socket.emit("typing", { chatId });
};

export const emitStopTyping = (chatId) => {
  socket.emit("stopTyping", { chatId });
};
