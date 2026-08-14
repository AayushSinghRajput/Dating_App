import Profile from "../models/profileModel.js";
import { containsBannedContent } from "../utils/moderation.js";
import { getDiscoveryFeed } from "../services/recommendation/index.js";
import { logEvent } from "../services/recommendation/eventLogger.js";

const MAX_PHOTOS = 6;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
export const DEALBREAKER_KEYS = ["relationshipGoals", "smoking", "drinking", "pets", "wantsChildren"];

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
  if (typeof profileData.lifestyle === "string") {
    try {
      profileData.lifestyle = JSON.parse(profileData.lifestyle);
    } catch {
      return res.status(400).json({ message: "Invalid lifestyle data." });
    }
  }
  if (typeof profileData.coordinates === "string") {
    try {
      profileData.coordinates = JSON.parse(profileData.coordinates);
    } catch {
      return res.status(400).json({ message: "Invalid coordinates data." });
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

    // Section 6 — dealbreakers may only name a signal that actually supports
    // being promoted to a hard filter (see hardFilter.js's dealbreaker
    // handling); anything else is silently dropped rather than rejected, so
    // stale client versions can't wedge a user's preferences.
    const rawDealbreakers = Array.isArray(profileData.preferences.dealbreakers)
      ? profileData.preferences.dealbreakers
      : [];
    const dealbreakers = rawDealbreakers.filter((key) => DEALBREAKER_KEYS.includes(key));

    let maxDistanceKm = null;
    if (profileData.preferences.maxDistanceKm !== null && profileData.preferences.maxDistanceKm !== undefined) {
      const parsed = Number(profileData.preferences.maxDistanceKm);
      if (Number.isNaN(parsed) || parsed < 1) {
        return res.status(400).json({ message: "Invalid max distance." });
      }
      maxDistanceKm = parsed;
    }

    profileData.preferences = { minAge, maxAge, dealbreakers, maxDistanceKm };
  }

  // Frontend sends {lng, lat} (simplest shape to build from expo-location);
  // convert to the GeoJSON Point shape the schema/geo index expect.
  if (profileData.coordinates) {
    const lng = Number(profileData.coordinates.lng);
    const lat = Number(profileData.coordinates.lat);
    if (Number.isNaN(lng) || Number.isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Invalid coordinates." });
    }
    profileData.coordinates = { type: "Point", coordinates: [lng, lat] };
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

// @desc    Record that the logged-in user viewed another user's full profile
//          (Section 20's PROFILE_VIEW event) — feeds behaviorModel.js the
//          same way LIKE/PASS do, just a weaker signal (no weight in
//          summarizeInteractions yet, but the raw event is captured for
//          when that's worth adding).
// @route   POST /api/profile/:targetUserId/view
// @access  Private
export const recordProfileView = async (req, res) => {
  const viewerId = req.user.id;
  const { targetUserId } = req.params;

  if (viewerId !== targetUserId) {
    logEvent(viewerId, targetUserId, "PROFILE_VIEW");
  }

  res.status(204).send();
};
