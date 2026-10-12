import { io } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BASE_URL } from "../services/apiClient";

export const socket = io(BASE_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
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
