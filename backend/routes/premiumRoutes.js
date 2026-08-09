import express from "express";
import { getPremiumStatus, activateBoost } from "../controllers/premiumController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/status", protect, getPremiumStatus);
router.post("/boost", protect, activateBoost);

export default router;
