import mongoose from "mongoose";
import Notification from "../models/notificationModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";

async function buildFromUserPayload(fromUserId) {
  const [fromUser, fromProfile] = await Promise.all([
    User.findById(fromUserId).select("username"),
    Profile.findOne({ user: fromUserId }).select("profileImage"),
  ]);
  return {
    _id: fromUserId,
    username: fromUser?.username || "Someone",
    profileImage: fromProfile?.profileImage || "",
  };
}

// Persists a notification for `userId` and pushes it live over that user's
// personal socket room (joined as `socket.join(socket.userId)`).
export async function sendNotification(io, { userId, type, fromUserId, chat, callType }) {
  const recipient = await User.findById(userId).select("notificationPreferences");
  if (recipient?.notificationPreferences?.[type] === false) {
    return null; // recipient has muted this notification type
  }

  const notificationId = new mongoose.Types.ObjectId();
  const createdAt = new Date();

  // Persist and look up the actor's display info concurrently (rather than
  // sequentially) so the notification reaches the client as soon as possible.
  const [fromUserPayload] = await Promise.all([
    fromUserId ? buildFromUserPayload(fromUserId) : Promise.resolve(null),
    Notification.create({
      _id: notificationId,
      user: userId,
      type,
      fromUser: fromUserId,
      chat,
      callType,
      createdAt,
    }),
  ]);

  const payload = {
    _id: notificationId,
    type,
    chat,
    callType,
    read: false,
    createdAt,
    fromUser: fromUserPayload,
  };

  io?.to(userId.toString()).emit("newNotification", payload);
  return payload;
}

// Tells a just-banned user's app to log itself out immediately, then force-
// disconnects their live socket(s) shortly after (delayed so the event has
// time to actually reach the client first — an instant disconnect could beat
// the emit across the wire).
export function notifyBannedUser(io, userId, reason) {
  const room = userId.toString();
  io?.to(room).emit("accountBanned", { reason: reason || "" });
  setTimeout(() => {
    io?.in(room).disconnectSockets(true);
  }, 500);
}

// Removes a previously-sent notification (e.g. when an action that created it,
// like favoriting, is undone) and tells the recipient's client to drop it live.
export async function retractNotification(io, { userId, fromUserId, type }) {
  const removed = await Notification.findOneAndDelete(
    { user: userId, fromUser: fromUserId, type },
    { sort: { createdAt: -1 } }
  );

  if (removed) {
    io?.to(userId.toString()).emit("notificationRemoved", {
      _id: removed._id,
      wasUnread: !removed.read,
    });
  }

  return removed;
}
