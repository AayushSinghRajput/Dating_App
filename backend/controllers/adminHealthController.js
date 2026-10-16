import mongoose from "mongoose";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import { getOnlineUserIds } from "../utils/socket.js";

// @desc    Get real-time system and infrastructure health telemetry
// @route   GET /api/admin/health
// @access  Private/Admin
export const getSystemHealth = async (req, res) => {
  const memory = process.memoryUsage();
  const uptimeSeconds = process.uptime();

  const mongoStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const [totalUsers, totalChats, totalMessages, onlineIds] = await Promise.all([
    User.countDocuments({}),
    Chat.countDocuments({}),
    Message.countDocuments({}),
    Promise.resolve(getOnlineUserIds()),
  ]);

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.round(uptimeSeconds),
      formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
    },
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    memory: {
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 10) / 10,
      rssMb: Math.round((memory.rss / 1024 / 1024) * 10) / 10,
    },
    database: {
      status: mongoStatusMap[mongoose.connection.readyState] || "unknown",
      host: mongoose.connection.host || "localhost",
      name: mongoose.connection.name || "dating_app",
      readyState: mongoose.connection.readyState,
    },
    realtime: {
      activeSockets: onlineIds.length,
      onlineUserCount: onlineIds.length,
    },
    counts: {
      totalUsers,
      totalChats,
      totalMessages,
    },
  });
};
