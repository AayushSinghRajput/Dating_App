import Profile from "../models/profileModel.js";
import { containsBannedContent } from "../utils/moderation.js";
import { getDiscoveryFeed } from "../services/recommendation/index.js";

const MAX_PHOTOS = 6;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// @desc    Create or update the logged-in user's profile
// @route   POST /api/profile/create
// @access  Private
export const createOrUpateProfile = async (req, res) => {
  const userId = req.user.id;
  const profileData = req.body;

  // multipart/form-data can't carry nested objects, so the client sends
  // prompts/preferences as JSON strings in a single field — parse them back
  // into objects here before validation/save.
  if (typeof profileData.prompts === "string") {
    try {
      profileData.prompts = JSON.parse(profileData.prompts);
    } catch {
      return res.status(400).json({ message: "Invalid prompts data." });
    }
  }
  if (typeof profileData.preferences === "string") {
    try {
      profileData.preferences = JSON.parse(profileData.preferences);
    } catch {
      return res.status(400).json({ message: "Invalid preferences data." });
    }
  }

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

  if (profileData.preferences) {
    const minAge = Number(profileData.preferences.minAge);
    const maxAge = Number(profileData.preferences.maxAge);
    if (
      Number.isNaN(minAge) || Number.isNaN(maxAge) ||
      minAge < 18 || maxAge < 18 || minAge > maxAge
    ) {
      return res.status(400).json({ message: "Invalid age preference range." });
    }
    profileData.preferences = { minAge, maxAge };
  }

  const promptTextFlagged = Array.isArray(profileData.prompts)
    ? profileData.prompts.some((p) => containsBannedContent(p?.answer))
    : false;

  if (
    containsBannedContent(profileData.name) ||
    containsBannedContent(profileData.aboutMe) ||
    promptTextFlagged
  ) {
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

// @desc    Discovery feed. Runs the modular recommendation pipeline (see
//          backend/services/recommendation) — safety & eligibility, hard
//          filters (reciprocal age/gender, already-swiped), rule-based
//          weighted ranking, and a freshness penalty against recent
//          impressions. See backend/services/recommendation/index.js for
//          the full pipeline description.
// @route   GET /api/profile/allprofiles?page=&limit=
// @access  Private
export const getAllProfiles = async (req, res) => {
  const loggedInUserId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE));

  const { profiles, algorithmVersion } = await getDiscoveryFeed(loggedInUserId, { page, limit });

  res.set("X-Algorithm-Version", algorithmVersion);
  res.status(200).json(profiles);
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
