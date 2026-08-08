import express from "express";
import { reportUser } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:targetUserId", protect, reportUser);

export default router;
