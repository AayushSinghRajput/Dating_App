import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export interface AppNotification {
  _id: string;
  type: "like" | "match" | "missed_call" | "favorite";
  chat?: string;
  callType?: "audio" | "video";
  read: boolean;
  createdAt: string;
  fromUser: {
    _id: string;
    username: string;
    profileImage?: string;
  } | null;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch notifications");
  return data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch unread count");
  return data.count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${authToken}` },
  });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${authToken}` },
  });
};

export interface NotificationPreferences {
  like: boolean;
  match: boolean;
  missed_call: boolean;
  favorite: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch preferences");
  return data.preferences;
};

export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update preferences");
  return data.preferences;
};
