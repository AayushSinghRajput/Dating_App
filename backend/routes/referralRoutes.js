import express from "express";
import { getReferralInfo } from "../controllers/referralController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getReferralInfo);

export default router;
