import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { socket, connectSocket } from "@/utils/socket";
import { getActiveChatId } from "@/src/utils/activeChat";
import { getUnreadChatsCount } from "@/services/chatService";

interface ChatNotificationContextValue {
  unreadChatsCount: number;
  refresh: () => Promise<void>;
}

const ChatNotificationContext = createContext<ChatNotificationContextValue | null>(null);

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const count = await getUnreadChatsCount();
      setUnreadChatsCount(count);
    } catch (err) {
      console.error("Failed to load unread chats count:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    connectSocket();

    const handleNewMessagePreview = (payload: {
      chatId: string;
      senderId: string;
      senderName: string;
      senderAvatar?: string;
      preview: string;
    }) => {
      refresh();

      // Don't toast for the conversation the user is already looking at.
      if (payload.chatId === getActiveChatId()) return;

      Toast.show({
        type: "info",
        text1: payload.senderName || "New message",
        text2: payload.preview,
        onPress: () => {
          router.push({
            pathname: "/screen/ChatDetail/[chatId]",
            params: {
              chatId: payload.chatId,
              name: payload.senderName,
              avatar: payload.senderAvatar || "",
              otherUserId: payload.senderId,
            },
          });
        },
      });
    };

    socket.on("newMessagePreview", handleNewMessagePreview);
    return () => {
      socket.off("newMessagePreview", handleNewMessagePreview);
    };
  }, [refresh, router]);

  return (
    <ChatNotificationContext.Provider value={{ unreadChatsCount, refresh }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

const fallback: ChatNotificationContextValue = {
  unreadChatsCount: 0,
  refresh: async () => {},
};

export function useChatNotifications() {
  const ctx = useContext(ChatNotificationContext);
  if (!ctx) {
    if (__DEV__) {
      console.warn("useChatNotifications called outside ChatNotificationProvider — returning empty state");
    }
    return fallback;
  }
  return ctx;
}
