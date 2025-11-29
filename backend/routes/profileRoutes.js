import express from "express";
import {createOrUpateProfile , getProfile, getAllProfiles,toggleFavorite,getFavorites} from '../controllers/profileController.js';
import {protect} from '../middleware/authMiddleware.js';
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post('/create',protect,upload.single("profileImage"),createOrUpateProfile);
router.get('/me',protect,getProfile);
router.get('/allprofiles',protect,getAllProfiles);
router.get('/favorites',protect,getFavorites);
router.post("/:targetUserId/favorite",protect,toggleFavorite);

export default router;