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
      handleNotification: async (notification: any) => {
        const type = notification?.request?.content?.data?.type;
        // Suppress incoming_call push notifications: CallRingingService handles the persistent notification
        if (type === "incoming_call") {
          return {
            shouldShowBanner: false,
            shouldShowList: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          };
        }
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        };
      },
    });
  }
} catch {
  // expo-notifications native module not compiled into current dev build
}

export { Notifications };

const PUSH_TOKEN_STORAGE_KEY = "expo_push_token";

export async function setupNotificationChannelsAndCategoriesAsync(): Promise<void> {
  if (!Notifications || Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Soulmate Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#e63946",
      sound: "default",
    });

    // Remove older channels
    await Notifications.deleteNotificationChannelAsync("voip_calls_v2").catch(() => {});
    await Notifications.deleteNotificationChannelAsync("voip_calls_v3").catch(() => {});

    // 30 seconds continuous ringing vibration pattern
    const callVibrationPattern = [
      0, 1200, 800, 1200, 800, 1200, 800, 1200, 800, 1200, 800,
      1200, 800, 1200, 800, 1200, 800, 1200, 800, 1200, 800,
      1200, 800, 1200, 800, 1200, 800, 1200, 800, 1200, 800,
    ];

    // High-importance channel specifically for incoming VoIP calls
    await Notifications.setNotificationChannelAsync("voip_calls_v4", {
      name: "Voice & Video Calls",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: callVibrationPattern,
      lightColor: "#e63946",
      sound: "default",
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        flags: {
          enforceAudibility: true,
          requestHardwareAudioVideoSynchronization: false,
        },
      },
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Call action buttons: Accept & Decline
    await Notifications.setNotificationCategoryAsync("incoming_call", [
      {
        identifier: "accept",
        buttonTitle: "Accept",
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: "decline",
        buttonTitle: "Decline",
        options: {
          opensAppToForeground: false,
          isDestructive: true,
        },
      },
    ]);
  } catch (err) {
    console.warn("[Push Notifications] Error configuring channels/categories:", err);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications || !Device) {
    return null;
  }

  try {
    // Unconditionally configure channels and categories on both physical devices and emulators
    await setupNotificationChannelsAndCategoriesAsync();

    if (!Device.isDevice) {
      console.log("[Push Notifications] Emulator detected. Channels & categories configured; skipping token push registration.");
      return null;
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

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const pushToken = tokenData.data;

      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
      await registerPushTokenApi(pushToken);

      return pushToken;
    } catch (tokenErr) {
      console.warn(
        "[Push Notifications] Error obtaining push token:",
        tokenErr instanceof Error ? tokenErr.message : tokenErr
      );
      return null;
    }
  } catch (error) {
    console.error("[Push Notifications] Error setting up notifications:", error);
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

    setupNotificationChannelsAndCategoriesAsync().catch(() => {});
    registerForPushNotificationsAsync();

    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          // Incoming calls are handled specifically by CallContext
          if (data?.type === "incoming_call") {
            return;
          }
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
