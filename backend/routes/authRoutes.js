import express from "express";
import { registerUser, loginUser, googleAuth } from "../controllers/authController.js";
import { forgotPassword, resetPassword, changePassword } from "../controllers/passwordController.js";
import {
  sendVerificationEmail,
  verifyEmail,
  changeEmail,
} from "../controllers/emailVerificationController.js";
import { getCurrentUser, deleteAccount } from "../controllers/accountController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/me", protect, getCurrentUser);
router.delete("/account", protect, deleteAccount);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);

router.post("/send-verification-email", protect, sendVerificationEmail);
router.post("/verify-email", protect, verifyEmail);
router.post("/change-email", protect, changeEmail);

export default router;
