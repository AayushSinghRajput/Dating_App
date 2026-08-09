import express from "express";
import { initiateEsewaPayment, getEsewaForm, esewaCallback, esewaFailure } from "../controllers/esewaController.js";
import { initiateKhaltiPayment, khaltiCallback } from "../controllers/khaltiController.js";
import { getTransactionStatus } from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected — called by the app with a Bearer token
router.post("/esewa/initiate", protect, initiateEsewaPayment);
router.post("/khalti/initiate", protect, initiateKhaltiPayment);
router.get("/status/:transactionUuid", protect, getTransactionStatus);

// Public — opened directly in the user's browser as part of the payment redirect flow
router.get("/esewa/form/:transactionUuid", getEsewaForm);
router.get("/esewa/callback", esewaCallback);
router.get("/esewa/failure", esewaFailure);
router.get("/khalti/callback", khaltiCallback);

export default router;
