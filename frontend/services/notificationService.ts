import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, handleAuthFailure } from "./apiClient";

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
  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      await handleAuthFailure(res);
      throw new Error(data.message || "Failed to fetch notifications");
    }
    return data;
  } catch (err: any) {
    if (err.name === "TypeError") throw new Error("Network error");
    throw err;
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) return 0;
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) {
      await handleAuthFailure(res);
      return 0;
    }
    const data = await res.json();
    return data.count ?? 0;
  } catch {
    return 0;
  }
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

export const registerPushTokenApi = async (pushToken: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) return;
  try {
    await fetch(`${BASE_URL}/api/notifications/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken }),
    });
  } catch (err) {
    console.error("Failed to register push token with backend:", err);
  }
};

export const removePushTokenApi = async (pushToken: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) return;
  try {
    await fetch(`${BASE_URL}/api/notifications/push-token`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken }),
    });
  } catch (err) {
    console.error("Failed to remove push token from backend:", err);
  }
};
