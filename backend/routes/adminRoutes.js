import express from "express";
import { getAnalyticsSummary } from "../controllers/adminAnalyticsController.js";
import {
  listUsers,
  banUser,
  unbanUser,
  removeUserPhoto,
  getUserProfile,
} from "../controllers/adminUserController.js";
import { listReports, resolveReport } from "../controllers/adminReportController.js";
import { cloudinaryModerationWebhook } from "../controllers/adminModerationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public — called by Cloudinary, not an admin browser session
router.post("/cloudinary-webhook", cloudinaryModerationWebhook);

router.use(protect, protectAdmin);

router.get("/analytics", getAnalyticsSummary);

router.get("/users", listUsers);
router.get("/users/:userId/profile", getUserProfile);
router.post("/users/:userId/ban", banUser);
router.post("/users/:userId/unban", unbanUser);
router.delete("/users/:userId/photo", removeUserPhoto);

router.get("/reports", listReports);
router.post("/reports/:reportId/resolve", resolveReport);

export default router;
