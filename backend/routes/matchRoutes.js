import express from "express";
import {
  likeProfile,
  passProfile,
  getMatches,
} from "../controllers/matchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/like", protect, likeProfile);
router.post("/pass", protect, passProfile);
router.get("/matches", protect, getMatches);

export default router;
