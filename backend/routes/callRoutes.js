import express from "express";
import { getIceServers } from "../controllers/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/ice-servers", protect, getIceServers);

export default router;
