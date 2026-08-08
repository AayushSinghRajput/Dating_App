import express from "express";
import {
  registerUser,
  loginUser,
  deleteAccount,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/account", protect, deleteAccount);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
