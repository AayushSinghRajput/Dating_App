import express from "express";
import {
  getAnalyticsSummary,
  getRevenueAnalytics,
  getCohortAnalytics,
  getFunnelAnalytics,
  getGeoAnalytics,
  getMatchQualityMetrics,
  getSwipeFatigueTracker,
} from "../controllers/adminAnalyticsController.js";
import {
  listUsers,
  banUser,
  unbanUser,
  removeUserPhoto,
  getUserProfile,
  freezeUser,
  unfreezeUser,
  listSubscriptions,
  updateSubscription,
  toggleUserVerification,
  bulkUserAction,
  getInactiveUsersStats,
  remindInactiveUsers,
} from "../controllers/adminUserController.js";
import {
  listDeletionRequests,
  createDeletionRequest,
  approveDeletionRequest,
  rejectDeletionRequest,
} from "../controllers/adminDeletionController.js";
import {
  cloudinaryModerationWebhook,
  listModerationFlags,
  createPhotoFlag,
  actionModerationFlag,
} from "../controllers/adminModerationController.js";
import {
  listBlocklist,
  addBlocklistPhrase,
  deleteBlocklistPhrase,
  testBlocklistFilter,
} from "../controllers/adminBlocklistController.js";
import {
  getSuspiciousUsers,
  takeBotAction,
} from "../controllers/adminBotDetectionController.js";
import { listVerifications, setVerificationStatus } from "../controllers/adminVerificationController.js";
import { listReports, resolveReport } from "../controllers/adminReportController.js";
import { listTransactions, updateRefundStatus } from "../controllers/adminTransactionController.js";
import {
  sendBroadcastNotification,
  listBroadcastHistory,
  estimateBroadcastAudience,
} from "../controllers/adminBroadcastController.js";
import {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/adminAnnouncementController.js";
import {
  listEmailCampaigns,
  createEmailCampaign,
  sendEmailCampaign,
  deleteEmailCampaign,
} from "../controllers/adminEmailCampaignController.js";
import {
  listAdmins,
  assignAdminRole,
  promoteToAdmin,
  revokeAdminAccess,
} from "../controllers/adminRoleController.js";
import {
  listFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
} from "../controllers/adminFeatureFlagController.js";
import {
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../controllers/adminPlanController.js";
import {
  getAppConfig,
  updateAppConfig,
} from "../controllers/adminConfigController.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/adminCouponController.js";
import { exportUserData } from "../controllers/adminExportController.js";
import { generateImpersonationSession } from "../controllers/adminImpersonationController.js";
import { listAuditLogs } from "../controllers/adminAuditController.js";
import { getAlgorithmConfig, explainMatchPair } from "../controllers/adminAlgorithmController.js";
import { getSystemHealth } from "../controllers/adminHealthController.js";
import { listMessages, adminDeleteMessage, listChats } from "../controllers/adminChatController.js";
import {
  listTickets,
  getTicket,
  replyToTicket,
  updateTicket,
  getTicketStats,
} from "../controllers/adminTicketController.js";
import {
  toggleShadowban,
  updateTrustScore,
  listShadowbannedUsers,
} from "../controllers/adminShadowbanController.js";
import {
  listBannedDevices,
  banDevice,
  unbanDevice,
  getDeviceClusters,
} from "../controllers/adminDeviceController.js";
import {
  listPromptModeration,
  resolvePromptModeration,
  getPromptModerationStats,
} from "../controllers/adminPromptModerationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public — called by Cloudinary, not an admin browser session
router.post("/cloudinary-webhook", cloudinaryModerationWebhook);

router.use(protect, protectAdmin);

// Session check
router.get("/me", (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
    },
  });
});

router.get("/analytics", getAnalyticsSummary);
router.get("/analytics/revenue", getRevenueAnalytics);
router.get("/analytics/cohorts", getCohortAnalytics);
router.get("/analytics/funnel", getFunnelAnalytics);
router.get("/analytics/geo", getGeoAnalytics);
router.get("/analytics/match-quality", getMatchQualityMetrics);
router.get("/analytics/swipe-fatigue", getSwipeFatigueTracker);

// Users (Phase 1 & Phase 2)
router.get("/users/inactive/stats", getInactiveUsersStats);
router.post("/users/inactive/remind", remindInactiveUsers);
router.post("/users/bulk", bulkUserAction);
router.get("/users", listUsers);
router.get("/users/:userId/profile", getUserProfile);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/unban", unbanUser);
router.delete("/users/:userId/photo", removeUserPhoto);
router.patch("/users/:userId/freeze", freezeUser);
router.patch("/users/:userId/unfreeze", unfreezeUser);
router.patch("/users/:userId/verify", toggleUserVerification);

// Deletion Requests Queue (Phase 2)
router.get("/deletion-requests", listDeletionRequests);
router.post("/deletion-requests", createDeletionRequest);
router.post("/deletion-requests/:id/approve", approveDeletionRequest);
router.post("/deletion-requests/:id/reject", rejectDeletionRequest);

// Subscriptions
router.get("/subscriptions", listSubscriptions);
router.patch("/subscriptions/:userId", updateSubscription);

// Reports
router.get("/reports", listReports);
router.post("/reports/:reportId/resolve", resolveReport);

// Verifications
router.get("/verifications", listVerifications);
router.post("/verifications/:userId/action", setVerificationStatus);

// Transactions & Refunds
router.get("/transactions", listTransactions);
router.patch("/transactions/:transactionId/refund", updateRefundStatus);

// Broadcasts
router.post("/broadcast", sendBroadcastNotification);
router.get("/broadcasts", listBroadcastHistory);

// Audit Logs
router.get("/audit-logs", listAuditLogs);

// Algorithm & Recommendation
router.get("/algorithm", getAlgorithmConfig);
router.post("/algorithm/explain", explainMatchPair);

// System Health
router.get("/health", getSystemHealth);

// Chat Moderation (Phase 1)
router.get("/chats", listChats);
router.get("/messages", listMessages);
router.delete("/messages/:messageId", adminDeleteMessage);

// Support Tickets (Phase 1)
router.get("/tickets/stats", getTicketStats);
router.get("/tickets", listTickets);
router.get("/tickets/:ticketId", getTicket);
router.patch("/tickets/:ticketId", updateTicket);
router.post("/tickets/:ticketId/reply", replyToTicket);

// Content Moderation & AI Queue (Phase 4)
router.get("/moderation/photos", listModerationFlags);
router.post("/moderation/photos", createPhotoFlag);
router.post("/moderation/photos/:id/action", actionModerationFlag);

// Keyword Blocklist Manager (Phase 4)
router.get("/blocklist", listBlocklist);
router.post("/blocklist", addBlocklistPhrase);
router.delete("/blocklist/:id", deleteBlocklistPhrase);
router.post("/blocklist/test", testBlocklistFilter);

// Bot & Fake Profile Detection (Phase 4)
router.get("/bots", getSuspiciousUsers);
router.post("/bots/:userId/action", takeBotAction);

// Broadcast Audience Estimation (Phase 4)
router.post("/broadcast/estimate", estimateBroadcastAudience);

// In-App Announcement Banners (Phase 4)
router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

// Email Campaigns (Phase 4)
router.get("/email-campaigns", listEmailCampaigns);
router.post("/email-campaigns", createEmailCampaign);
router.post("/email-campaigns/:id/send", sendEmailCampaign);
router.delete("/email-campaigns/:id", deleteEmailCampaign);

// Admin Role Management & RBAC (Feature 24)
router.get("/roles", listAdmins);
router.patch("/roles/:userId", assignAdminRole);
router.post("/roles/promote", promoteToAdmin);
router.delete("/roles/:userId", revokeAdminAccess);

// Feature Flag Manager (Feature 25)
router.get("/flags", listFeatureFlags);
router.post("/flags", createFeatureFlag);
router.patch("/flags/:id", updateFeatureFlag);
router.delete("/flags/:id", deleteFeatureFlag);

// Subscription Plan Editor & Pricing Configurator (Feature 26)
router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.patch("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

// App Configuration & Global Limits (Feature 27)
router.get("/config", getAppConfig);
router.patch("/config", updateAppConfig);

// Coupon / Promo Code Manager (Feature 28)
router.get("/coupons", listCoupons);
router.post("/coupons", createCoupon);
router.patch("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// GDPR Data Portability & User Data Export Tool (Feature 29)
router.get("/users/:userId/export", exportUserData);

// User Impersonation & Simulation Mode (Feature 30)
router.post("/users/:userId/impersonate", generateImpersonationSession);

// Shadowban & Trust Score Matrix (Feature 31)
router.get("/users/shadowbanned", listShadowbannedUsers);
router.post("/users/:userId/shadowban", toggleShadowban);
router.post("/users/:userId/trust-score", updateTrustScore);

// Device & Hardware Blacklist / Multi-Account Cluster Hunter (Feature 32)
router.get("/devices", listBannedDevices);
router.post("/devices/ban", banDevice);
router.delete("/devices/:id", unbanDevice);
router.get("/devices/clusters", getDeviceClusters);

// Voice Note & Prompt Moderation Queue (Feature 33)
router.get("/prompts-moderation/stats", getPromptModerationStats);
router.get("/prompts-moderation", listPromptModeration);
router.post("/prompts-moderation/:id/action", resolvePromptModeration);

export default router;
