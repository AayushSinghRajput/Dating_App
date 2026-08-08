import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { socket, connectSocket } from "@/utils/socket";
import {
  AppNotification,
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
} from "@/utils/api";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
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

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationRemoved", handleNotificationRemoved);
    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationRemoved", handleNotificationRemoved);
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

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}
