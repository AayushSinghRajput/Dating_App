import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { BASE_URL } from "../services/apiClient";

export const socket: Socket = io(BASE_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
});

/**
 * Connects or re-authenticates the socket with the active token.
 * If forceReconnect is true, or if the stored token differs from the socket's
 * current auth token, it gracefully disconnects the old session and reconnects.
 */
export const connectSocket = async (forceReconnect = false): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      if (socket.connected) {
        socket.disconnect();
      }
      return;
    }

    const currentAuthToken = (socket.auth as any)?.token;
    const isSameToken = currentAuthToken === token;

    if (socket.connected && isSameToken && !forceReconnect) {
      return;
    }

    if (socket.connected) {
      socket.disconnect();
    }

    socket.auth = { token };
    socket.connect();
  } catch (err) {
    console.error("[Socket] Failed to connect socket:", err);
  }
};

export const disconnectSocket = (): void => {
  socket.auth = {};
  if (socket.connected) {
    socket.disconnect();
  }
};

export const joinRoom = (chatId: string): void => {
  socket.emit("joinRoom", chatId);
};

export const emitTyping = (chatId: string): void => {
  socket.emit("typing", { chatId });
};

export const emitStopTyping = (chatId: string): void => {
  socket.emit("stopTyping", { chatId });
};

// Auto-reconnect when bringing app to foreground on mobile (handles Android OEM socket suspends)
AppState.addEventListener("change", (state: AppStateStatus) => {
  if (state === "active") {
    connectSocket();
  }
});
