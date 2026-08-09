import Notification from "../models/notificationModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";

const NOTIFICATION_TYPES = ["like", "super_like", "match", "missed_call", "favorite"];

export const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const notifications = await Notification.find({ user: userId })
    .populate("fromUser", "username")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // Batch-fetch every notification actor's profile in one query instead of
  // one query per notification.
  const fromUserIds = notifications.filter((n) => n.fromUser).map((n) => n.fromUser._id);
  const profiles = await Profile.find({ user: { $in: fromUserIds } }).select("user profileImage").lean();
  const profileByUserId = new Map(profiles.map((p) => [p.user.toString(), p]));

  const withProfiles = notifications.map((n) => ({
    _id: n._id,
    type: n.type,
    chat: n.chat,
    callType: n.callType,
    read: n.read,
    createdAt: n.createdAt,
    fromUser: n.fromUser
      ? {
          _id: n.fromUser._id,
          username: n.fromUser.username,
          profileImage: profileByUserId.get(n.fromUser._id.toString())?.profileImage || "",
        }
      : null,
  }));

  res.status(200).json(withProfiles);
};

export const getUnreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user.id, read: false });
  res.status(200).json({ count });
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true }
  );
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.status(200).json({ message: "Marked as read" });
};

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.status(200).json({ message: "All notifications marked as read" });
};

export const getNotificationPreferences = async (req, res) => {
  const user = await User.findById(req.user.id).select("notificationPreferences");
  res.status(200).json({ preferences: user.notificationPreferences });
};

export const updateNotificationPreferences = async (req, res) => {
  const updates = {};
  for (const type of NOTIFICATION_TYPES) {
    if (typeof req.body[type] === "boolean") {
      updates[`notificationPreferences.${type}`] = req.body[type];
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select(
    "notificationPreferences"
  );

  res.status(200).json({ preferences: user.notificationPreferences });
};
