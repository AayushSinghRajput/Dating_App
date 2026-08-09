import express from "express";
import { getEmergencyContacts, updateEmergencyContacts } from "../controllers/safetyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/emergency-contacts", protect, getEmergencyContacts);
router.put("/emergency-contacts", protect, updateEmergencyContacts);

export default router;
