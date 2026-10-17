import express from "express";
import { getIceServers, rejectCallHttp, endCallHttp } from "../controllers/callController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/ice-servers", protect, getIceServers);
router.post("/reject", rejectCallHttp);
router.post("/end", endCallHttp);

export default router;
