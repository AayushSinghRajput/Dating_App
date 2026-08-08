import express from "express";
import {
  likeProfile,
  passProfile,
  unmatchProfile,
  getMatches,
} from "../controllers/matchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/like", protect, likeProfile);
router.post("/pass", protect, passProfile);
router.post("/unmatch", protect, unmatchProfile);
router.get("/matches", protect, getMatches);

export default router;
