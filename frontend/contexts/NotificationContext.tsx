import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { socket, connectSocket } from "@/utils/socket";
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
} from "@/services/notificationService";
import { clearToken } from "@/services/apiClient";
import { showMatchCelebration } from "@/src/components/GlobalMatchCelebration";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    connectSocket();

    const handleNewNotification = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Both matched users get a "match" notification (see matchController.js),
      // so triggering the celebration here — rather than from the like action
      // itself — covers both people symmetrically without double-firing for
      // whichever one tapped "like" last.
      if (notification.type === "match" && notification.fromUser) {
        showMatchCelebration({
          userName: notification.fromUser.username,
          userAvatar: notification.fromUser.profileImage,
          otherUserId: notification.fromUser._id,
        });
      }
    };

    const handleNotificationRemoved = ({
      _id,
      wasUnread,
    }: {
      _id: string;
      wasUnread: boolean;
    }) => {
      setNotifications((prev) => prev.filter((n) => n._id !== _id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleAccountBanned = async ({ reason }: { reason?: string }) => {
      Toast.show({
        type: "error",
        text1: "Your account has been suspended",
        text2: reason || "Contact support if you think this is a mistake.",
        visibilityTime: 6000,
      });
      await clearToken();
      router.replace("/auth/login");
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationRemoved", handleNotificationRemoved);
    socket.on("accountBanned", handleAccountBanned);
    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationRemoved", handleNotificationRemoved);
      socket.off("accountBanned", handleAccountBanned);
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    let wasUnread = false;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n._id === id && !n.read) wasUnread = true;
        return n._id === id ? { ...n, read: true } : n;
      }),
    );
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationReadApi(id);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsReadApi();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

const noop = async () => {};

// Badge counts/notifications are non-critical — if this is ever read outside
// NotificationProvider (or before it has mounted), degrade to empty state
// instead of crashing the screen that renders it.
const fallback: NotificationContextValue = {
  notifications: [],
  unreadCount: 0,
  refresh: noop,
  markRead: noop,
  markAllRead: noop,
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    if (__DEV__) {
      console.warn("useNotifications called outside NotificationProvider — returning empty state");
    }
    return fallback;
  }
  return ctx;
}
