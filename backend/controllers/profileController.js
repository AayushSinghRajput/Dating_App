import mongoose from "mongoose";
import Profile from "../models/profileModel.js";
import { containsBannedContent } from "../utils/moderation.js";

const MAX_PHOTOS = 6;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// @desc    Create or update the logged-in user's profile
// @route   POST /api/profile/create
// @access  Private
export const createOrUpateProfile = async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  // Enforce minimum age server-side (the onboarding UI also checks this,
  // but that's trivially bypassable by calling the API directly).
  if (profileData.age !== undefined && profileData.age !== "") {
    const age = Number(profileData.age);
    if (Number.isNaN(age) || age < 18) {
      return res.status(400).json({
        message: "You must be at least 18 years old to use this app.",
      });
    }
  }

  if (containsBannedContent(profileData.name) || containsBannedContent(profileData.aboutMe)) {
    return res.status(400).json({
      message: "Your profile contains language that isn't allowed. Please revise it.",
    });
  }

  let profile = await Profile.findOne({ user: userId });

  // Newly uploaded photos get appended to whatever the user already has
  // (removing/reordering photos is handled by the dedicated endpoints below).
  const newPhotoUrls = (req.files || []).map((f) => f.path);
  if (newPhotoUrls.length > 0) {
    const existingPhotos = profile?.photos || [];
    const mergedPhotos = [...existingPhotos, ...newPhotoUrls].slice(0, MAX_PHOTOS);
    profileData.photos = mergedPhotos;
    profileData.profileImage = mergedPhotos[0];
  }

  if (profile) {
    profile = await Profile.findOneAndUpdate({ user: userId }, profileData, {
      new: true,
      runValidators: true,
    });
    return res.status(200).json({ message: "Profile Updated", profile });
  }

  const newProfile = new Profile({ ...profileData, user: userId });
  await newProfile.save();
  res.status(201).json({ message: "Profile Created", profile: newProfile });
};

// @desc    Get the logged-in user's own profile
// @route   GET /api/profile/me
// @access  Private
export const getProfile = async (req, res) => {
  const profile = await Profile.findOne({ user: req.user.id }).populate("user", "username email");
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.status(200).json(profile);
};

// @desc    Discovery feed: everyone except the logged-in user, blocked
//          users (either direction), and incognito profiles. Actively
//          boosted profiles are surfaced first.
// @route   GET /api/profile/allprofiles?page=&limit=
// @access  Private
export const getAllProfiles = async (req, res) => {
  const loggedInUserId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

  const myProfile = await Profile.findOne({ user: loggedInUserId }).select("blockedUsers").lean();
  const blockedByMe = (myProfile?.blockedUsers || []).map((id) => new mongoose.Types.ObjectId(id));

  const now = new Date();
  const loggedInObjectId = new mongoose.Types.ObjectId(loggedInUserId);

  const matchStage = {
    user: { $ne: loggedInObjectId, $nin: blockedByMe },
    incognito: { $ne: true },
    blockedUsers: { $ne: loggedInObjectId },
  };

  const profiles = await Profile.aggregate([
    { $match: matchStage },
    // Only an *active* boost should rank a profile first — an expired one
    // shouldn't permanently outrank profiles that never boosted.
    {
      $addFields: {
        boostRank: { $cond: [{ $gt: ["$boostedUntil", now] }, "$boostedUntil", null] },
      },
    },
    { $sort: { boostRank: -1, _id: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userDoc",
        pipeline: [{ $project: { username: 1 } }],
      },
    },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
  ]);

  const users = profiles.map((p) => ({
    id: p._id,
    userId: p.user,
    name: p.name || p.userDoc?.username,
    age: p.age,
    profileImage: p.profileImage,
    photos: p.photos,
    profession: p.profession,
    location: p.location,
    aboutMe: p.aboutMe,
    gender: p.gender,
    interestedIn: p.interestedIn,
    hobbies: p.hobbies,
    education: p.education,
    relationshipGoals: p.relationshipGoals,
    isVerified: p.verified,
  }));

  res.status(200).json(users);
};

// @desc    Toggle incognito mode: hides your profile from discovery for new
// people while leaving existing matches/chats unaffected.
// @route   PATCH /api/profile/incognito
// @access  Private
export const setIncognitoMode = async (req, res) => {
  const { incognito } = req.body;
  const profile = await Profile.findOneAndUpdate(
    { user: req.user.id },
    { incognito: Boolean(incognito) },
    { new: true }
  );
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.status(200).json({ incognito: profile.incognito });
};
