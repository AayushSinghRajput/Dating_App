import express from "express";
import { getClientConfig } from "../controllers/adminConfigController.js";
import { getActivePlans } from "../controllers/adminPlanController.js";
import { getClientFeatureFlags } from "../controllers/adminFeatureFlagController.js";
import { validateCoupon } from "../controllers/adminCouponController.js";
import { getActiveAnnouncements } from "../controllers/adminAnnouncementController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// App Limits, Discovery Radius, & Maintenance Status
router.get("/client", getClientConfig);

// Active In-App Announcements & Banners
router.get("/announcements/active", getActiveAnnouncements);

// Client Feature Flags & Rollout Toggles
router.get("/flags/client", getClientFeatureFlags);

// Active Subscription Plans & Pricing for Paywall
router.get("/plans/active", getActivePlans);

// Promo / Coupon Code Validation (accessible to authenticated users)
router.post("/coupons/validate", protect, validateCoupon);

export default router;
