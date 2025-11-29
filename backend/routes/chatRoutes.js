import express from "express";
import {
  getUserChats,
  createOrGetChat,
  sendMessage,
  getMessages,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUserChats);
router.post("/", protect, createOrGetChat);
router.post("/message", protect, sendMessage);
router.get("/:chatId/messages", protect, getMessages);

export default router;
