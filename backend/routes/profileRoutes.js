import express from "express";
import {createOrUpateProfile , getProfile, getAllProfiles,toggleFavorite,getFavorites,blockUser,unblockUser,getBlockedUsers,removePhoto,setPrimaryPhoto} from '../controllers/profileController.js';
import {protect} from '../middleware/authMiddleware.js';
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

const MAX_PHOTOS = 6;

router.post('/create',protect,upload.array("photos", MAX_PHOTOS),createOrUpateProfile);
router.get('/me',protect,getProfile);
router.get('/allprofiles',protect,getAllProfiles);
router.get('/favorites',protect,getFavorites);
router.post("/:targetUserId/favorite",protect,toggleFavorite);
router.get('/blocked',protect,getBlockedUsers);
router.post("/:targetUserId/block",protect,blockUser);
router.post("/:targetUserId/unblock",protect,unblockUser);
router.delete('/photos',protect,removePhoto);
router.patch('/photos/primary',protect,setPrimaryPhoto);

export default router;