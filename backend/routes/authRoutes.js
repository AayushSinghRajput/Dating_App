import express from "express";
import {
  registerUser,
  loginUser,
  deleteAccount,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  sendVerificationEmail,
  verifyEmail,
  changeEmail,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/account", protect, deleteAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.get("/me", protect, getCurrentUser);
router.post("/send-verification-email", protect, sendVerificationEmail);
router.post("/verify-email", protect, verifyEmail);
router.post("/change-email", protect, changeEmail);

export default router;
