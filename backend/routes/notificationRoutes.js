import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/read-all", protect, markAllNotificationsRead);
router.get("/preferences", protect, getNotificationPreferences);
router.patch("/preferences", protect, updateNotificationPreferences);
router.patch("/:id/read", protect, markNotificationRead);

export default router;
