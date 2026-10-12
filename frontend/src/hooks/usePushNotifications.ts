import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { registerPushTokenApi, removePushTokenApi } from "@/services/notificationService";

type DeviceModule = typeof import("expo-device");
type NotificationsModule = typeof import("expo-notifications");

let Device: DeviceModule | null = null;
let Notifications: NotificationsModule | null = null;

// Dynamically load native modules so the app doesn't crash if running in a
// development build where new native dependencies have not been re-compiled yet.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Device = require("expo-device");
} catch {
  // expo-device native module not compiled into current dev build
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch {
  // expo-notifications native module not compiled into current dev build
}

const PUSH_TOKEN_STORAGE_KEY = "expo_push_token";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device) {
    console.log(
      "[Push Notifications] Native modules not linked in current dev build. Push notifications will activate after a new dev client build."
    );
    return null;
  }

  try {
    if (!Device.isDevice) {
      console.log("[Push Notifications] Must use physical device for push notifications.");
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Soulmate Notifications",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#e63946",
        sound: "default",
      });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push Notifications] Notification permission not granted.");
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const pushToken = tokenData.data;

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
    await registerPushTokenApi(pushToken);

    return pushToken;
  } catch (error) {
    console.error("[Push Notifications] Error getting Expo push token:", error);
    return null;
  }
}

export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      await removePushTokenApi(storedToken);
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error("[Push Notifications] Failed to unregister push token:", err);
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const responseListener = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!Notifications) return;

    registerForPushNotificationsAsync();

    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.url) {
            try {
              router.push(data.url as any);
            } catch (navError) {
              console.error("[Push Notifications] Navigation error on notification tap:", navError);
            }
          }
        }
      );
    } catch (err) {
      console.warn("[Push Notifications] Failed to attach response listener:", err);
    }

    return () => {
      responseListener.current?.remove();
    };
  }, [router]);
}
