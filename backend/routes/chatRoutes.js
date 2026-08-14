import express from "express";
import { getUserChats, createOrGetChat, markChatRead, getUnreadChatsCount } from "../controllers/chatController.js";
import {
  sendMessage,
  sendVoiceMessage,
  sendMediaMessage,
  deleteMessage,
  getMessages,
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAudio, uploadChatMedia } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, getUserChats);
router.post("/", protect, createOrGetChat);
router.get("/unread-count", protect, getUnreadChatsCount);
router.patch("/:chatId/read", protect, markChatRead);

router.post("/message", protect, sendMessage);
router.post("/message/audio", protect, uploadAudio.single("audio"), sendVoiceMessage);
router.post("/message/media", protect, uploadChatMedia.single("media"), sendMediaMessage);
router.delete("/message/:messageId", protect, deleteMessage);
router.get("/:chatId/messages", protect, getMessages);

export default router;
