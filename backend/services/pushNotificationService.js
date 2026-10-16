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

      messages.push({
        to: pushToken,
        sound,
        title,
        body,
        data,
        badge: 1,
        priority,
        channelId,
        sticky,
        ...(categoryId ? { categoryId } : {}),
      });
    }

    if (messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
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
