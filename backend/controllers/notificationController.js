import Notification from "../models/notificationModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";

const NOTIFICATION_TYPES = ["like", "match", "missed_call", "favorite"];

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user: userId })
      .populate("fromUser", "username")
      .sort({ createdAt: -1 })
      .limit(100);

    const withProfiles = await Promise.all(
      notifications.map(async (n) => {
        const profile = n.fromUser
          ? await Profile.findOne({ user: n.fromUser._id }).select("profileImage")
          : null;
        return {
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
                profileImage: profile?.profileImage || "",
              }
            : null,
        };
      })
    );

    res.status(200).json(withProfiles);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ message: "Error fetching unread notification count" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error marking all notifications as read" });
  }
};

export const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notificationPreferences");
    res.status(200).json({ preferences: user.notificationPreferences });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ message: "Error fetching notification preferences" });
  }
};

export const updateNotificationPreferences = async (req, res) => {
  try {
    const updates = {};
    for (const type of NOTIFICATION_TYPES) {
      if (typeof req.body[type] === "boolean") {
        updates[`notificationPreferences.${type}`] = req.body[type];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("notificationPreferences");

    res.status(200).json({ preferences: user.notificationPreferences });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ message: "Error updating notification preferences" });
  }
};
