import express from "express";
import {
  getUserChats,
  createOrGetChat,
  sendMessage,
  sendVoiceMessage,
  getMessages,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, getUserChats);
router.post("/", protect, createOrGetChat);
router.post("/message", protect, sendMessage);
router.post("/message/audio", protect, uploadAudio.single("audio"), sendVoiceMessage);
router.get("/:chatId/messages", protect, getMessages);

export default router;
