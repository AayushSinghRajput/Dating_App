import { Expo } from "expo-server-sdk";
import User from "../models/userModel.js";

const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN,
});

/**
 * Sends a background push notification to all registered devices of a given user.
 * Automatically validates tokens and prunes invalid/unregistered ones.
 */
export async function sendPushToUser(
  userId,
  {
    title,
    body,
    data = {},
    channelId = "default",
    categoryId,
    priority = "high",
    sound = "default",
    sticky = false,
  }
) {
  if (!userId) return;

  try {
    const user = await User.findById(userId).select("pushTokens notificationPreferences");
    if (!user || !Array.isArray(user.pushTokens) || user.pushTokens.length === 0) {
      return;
    }

    // Check if user turned off this specific notification category
    const type = data?.type;
    if (type && user.notificationPreferences?.[type] === false) {
      return;
    }

    const messages = [];
    for (const pushToken of user.pushTokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`[Push Notifications] Invalid Expo push token ignored: ${pushToken}`);
        continue;
      }

      const isCallSignaling =
        type === "incoming_call" ||
        type === "call_ended" ||
        type === "call_rejected";

      // For call signaling (incoming calls, ended, rejected):
      // MUST NOT send top-level title, body, or channelId.
      // Passing channelId, title, or body causes Expo and FCM to deliver an Android notification message,
      // which Google Play Services intercepts in the system tray when the app is killed without waking onMessageReceived.
      // Omitting channelId, title, and body ensures a 100% pure FCM DATA message,
      // which forces Google Play Services to wake up CallFirebaseMessagingService.onMessageReceived(),
      // start CallRingingService, play the ringtone, wake up the screen, and launch the incoming call screen.
      const message = isCallSignaling
        ? {
            to: pushToken,
            data,
            priority: "high",
            _contentAvailable: true,
          }
        : {
            to: pushToken,
            data,
            title,
            body,
            priority: "high",
            channelId: channelId || "default",
            sound: sound || "default",
            sticky,
            categoryId,
            badge: 1,
          };

      messages.push(message);
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("[Push Notifications] Expo ticketChunk response:", ticketChunk);
        const deadTokens = [];

        ticketChunk.forEach((ticket, idx) => {
          if (ticket.status === "error") {
            console.error(`[Push Notifications] Delivery error for token ${chunk[idx].to}:`, ticket.message);
            if (ticket.details?.error === "DeviceNotRegistered") {
              deadTokens.push(chunk[idx].to);
            }
          }
        });

        // Auto-prune uninstalled/expired device tokens
        if (deadTokens.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $pull: { pushTokens: { $in: deadTokens } },
          });
          console.log(`[Push Notifications] Pruned ${deadTokens.length} dead token(s) for user ${userId}`);
        }
      } catch (chunkError) {
        console.error("[Push Notifications] Error sending push chunk:", chunkError);
      }
    }
  } catch (error) {
    console.error("[Push Notifications] Failed to send push notification:", error);
  }
}
