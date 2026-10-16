import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Transaction from "../models/transactionModel.js";
import Report from "../models/reportModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Export a complete GDPR JSON data archive for a specific user
// @route   GET /api/admin/users/:userId/export
// @access  Private/Admin
export const exportUserData = async (req, res) => {
  const { userId } = req.params;

  const [user, profile, transactions, reportsFiled, reportsReceived, chats] = await Promise.all([
    User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpires").lean(),
    Profile.findOne({ user: userId }).lean(),
    Transaction.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    Report.find({ reporter: userId }).lean(),
    Report.find({ reportedUser: userId }).lean(),
    Chat.find({ participants: userId }).lean(),
  ]);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Collect chat message metadata (without compromising other party's secret keys)
  const chatIds = chats.map((c) => c._id);
  const messages = await Message.find({ chat: { $in: chatIds } })
    .select("chat sender message type createdAt read")
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  const gdprArchive = {
    metadata: {
      generatedAt: new Date().toISOString(),
      platform: "Soulmate Dating App",
      complianceNotice: "Exported in accordance with GDPR Article 20 Right to Data Portability",
      exportedByAdmin: req.user.username,
    },
    account: {
      id: user._id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      notificationPreferences: user.notificationPreferences,
      emergencyContacts: user.emergencyContacts,
    },
    profile: profile || null,
    activityStats: {
      totalLikesSent: profile?.likes?.length || 0,
      totalPassesSent: profile?.passes?.length || 0,
      totalSuperLikesSent: profile?.superLikes?.length || 0,
      totalMatches: profile?.matches?.length || 0,
    },
    financialRecords: transactions,
    trustAndSafety: {
      reportsFiledByDater: reportsFiled.length,
      reportsReceivedAgainstDater: reportsReceived.length,
      banned: user.banned,
      banReason: user.banReason,
      frozen: user.frozen,
      frozenReason: user.frozenReason,
    },
    conversationsCount: chats.length,
    messagesExportedSample: messages.map((m) => ({
      messageId: m._id,
      isSender: m.sender.toString() === userId.toString(),
      type: m.type,
      sentAt: m.createdAt,
      read: m.read,
      textPreview: m.type === "text" ? m.message : `[${m.type} attachment]`,
    })),
  };

  await logAdminAction({
    adminId: req.user._id,
    action: "GDPR_USER_DATA_EXPORT",
    targetId: userId,
    targetType: "User",
    details: { username: user.username, recordsIncluded: Object.keys(gdprArchive).length },
    req,
  });

  res.setHeader("Content-Disposition", `attachment; filename=soulmate-gdpr-user-${user.username}.json`);
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(gdprArchive, null, 2));
};
