import FeatureFlag from "../models/featureFlagModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

const DEFAULT_FLAGS = [
  {
    key: "voice_notes",
    name: "Chat Voice Notes",
    description: "Allows daters to record and transmit audio voice notes inside direct messaging.",
    enabled: true,
    rolloutPercentage: 100,
    minimumAppVersion: "1.0.0",
    targetTiers: ["free", "premium"],
  },
  {
    key: "video_calls",
    name: "1-on-1 Video Calling",
    description: "WebRTC encrypted peer-to-peer video calls for mutual matches.",
    enabled: true,
    rolloutPercentage: 100,
    minimumAppVersion: "1.0.0",
    targetTiers: ["free", "premium"],
  },
  {
    key: "super_likes",
    name: "SuperLike Star Burst",
    description: "Enables instant priority notifications and blue deck border styling.",
    enabled: true,
    rolloutPercentage: 100,
    minimumAppVersion: "1.0.0",
    targetTiers: ["free", "premium"],
  },
  {
    key: "photo_verification",
    name: "Selfie Pose Verification",
    description: "Enables camera selfie matching to award official blue verification checkmarks.",
    enabled: true,
    rolloutPercentage: 100,
    minimumAppVersion: "1.0.0",
    targetTiers: ["free", "premium"],
  },
  {
    key: "travel_mode",
    name: "Global Passport / Travel Mode",
    description: "Allows subscribers to change their discovery city and match anywhere globally.",
    enabled: true,
    rolloutPercentage: 100,
    minimumAppVersion: "1.1.0",
    targetTiers: ["premium"],
  },
  {
    key: "ai_icebreakers",
    name: "AI Conversation Starters",
    description: "Suggests witty, profile-tailored conversation openers upon mutual match.",
    enabled: false,
    rolloutPercentage: 50,
    minimumAppVersion: "1.2.0",
    targetTiers: ["free", "premium"],
  },
];

// @desc    List all feature flags (seeds defaults if empty)
// @route   GET /api/admin/flags
// @access  Private/Admin
export const listFeatureFlags = async (req, res) => {
  let flags = await FeatureFlag.find({}).sort({ createdAt: -1 }).lean();

  if (flags.length === 0) {
    await FeatureFlag.insertMany(DEFAULT_FLAGS);
    flags = await FeatureFlag.find({}).sort({ createdAt: -1 }).lean();
  }

  res.status(200).json({ flags });
};

// @desc    Create a new feature flag
// @route   POST /api/admin/flags
// @access  Private/Admin
export const createFeatureFlag = async (req, res) => {
  const { key, name, description, enabled = true, rolloutPercentage = 100, minimumAppVersion = "1.0.0", targetTiers = ["free", "premium"] } = req.body;

  if (!key || !name) {
    return res.status(400).json({ message: "Key and Name are required" });
  }

  const existing = await FeatureFlag.findOne({ key: key.trim().toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: `Flag with key "${key}" already exists.` });
  }

  const flag = await FeatureFlag.create({
    key: key.trim().toLowerCase(),
    name,
    description,
    enabled,
    rolloutPercentage: Math.max(0, Math.min(100, Number(rolloutPercentage) || 100)),
    minimumAppVersion,
    targetTiers,
    updatedBy: req.user._id,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_FEATURE_FLAG",
    targetType: "FeatureFlag",
    details: { key: flag.key, enabled: flag.enabled },
    req,
  });

  res.status(201).json({ message: "Feature flag created", flag });
};

// @desc    Update or toggle feature flag
// @route   PATCH /api/admin/flags/:id
// @access  Private/Admin
export const updateFeatureFlag = async (req, res) => {
  const { id } = req.params;

  const flag = await FeatureFlag.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user._id },
    { new: true }
  );

  if (!flag) return res.status(404).json({ message: "Feature flag not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_FEATURE_FLAG",
    targetType: "FeatureFlag",
    details: { key: flag.key, enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage },
    req,
  });

  res.status(200).json({ message: "Feature flag updated", flag });
};

// @desc    Delete feature flag
// @route   DELETE /api/admin/flags/:id
// @access  Private/Admin
export const deleteFeatureFlag = async (req, res) => {
  const { id } = req.params;

  const flag = await FeatureFlag.findByIdAndDelete(id);
  if (!flag) return res.status(404).json({ message: "Feature flag not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_FEATURE_FLAG",
    targetType: "FeatureFlag",
    details: { key: flag.key },
    req,
  });

  res.status(200).json({ message: "Feature flag deleted", id });
};

// @desc    Client-facing endpoint to fetch active feature flags
// @route   GET /api/flags/client
// @access  Public
export const getClientFeatureFlags = async (req, res) => {
  const flags = await FeatureFlag.find({ enabled: true })
    .select("key rolloutPercentage minimumAppVersion targetTiers")
    .lean();

  const flagMap = Object.fromEntries(
    flags.map((f) => [
      f.key,
      {
        enabled: true,
        rollout: f.rolloutPercentage,
        minVersion: f.minimumAppVersion,
        tiers: f.targetTiers,
      },
    ])
  );

  res.status(200).json({ flags: flagMap });
};
