import express from "express";
import {
  createOrUpateProfile,
  getProfile,
  getAllProfiles,
  setIncognitoMode,
  recordProfileView,
  explainProfileRecommendation,
} from "../controllers/profileController.js";
import { toggleFavorite, getFavorites } from "../controllers/profileFavoriteController.js";
import { blockUser, unblockUser, getBlockedUsers } from "../controllers/profileBlockController.js";
import { removePhoto, setPrimaryPhoto, verifyProfilePhoto } from "../controllers/profilePhotoController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload, { uploadVerificationSelfie } from "../middleware/uploadMiddleware.js";

const router = express.Router();

const MAX_PHOTOS = 6;

router.post("/create", protect, upload.array("photos", MAX_PHOTOS), createOrUpateProfile);
router.get("/me", protect, getProfile);
router.get("/allprofiles", protect, getAllProfiles);
router.patch("/incognito", protect, setIncognitoMode);
router.post("/:targetUserId/view", protect, recordProfileView);
router.get("/:targetUserId/explain", protect, explainProfileRecommendation);

router.get("/favorites", protect, getFavorites);
router.post("/:targetUserId/favorite", protect, toggleFavorite);

router.get("/blocked", protect, getBlockedUsers);
router.post("/:targetUserId/block", protect, blockUser);
router.post("/:targetUserId/unblock", protect, unblockUser);

router.delete("/photos", protect, removePhoto);
router.patch("/photos/primary", protect, setPrimaryPhoto);
router.post("/verify", protect, uploadVerificationSelfie.single("selfie"), verifyProfilePhoto);

export default router;
