import AppConfig from "../models/appConfigModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Get dating app global configuration
// @route   GET /api/admin/config
// @access  Private/Admin
export const getAppConfig = async (req, res) => {
  let config = await AppConfig.findOne({ key: "global_dating_config" }).lean();

  if (!config) {
    config = await AppConfig.create({ key: "global_dating_config" });
  }

  res.status(200).json({ config });
};

// @desc    Update dating app global configuration
// @route   PATCH /api/admin/config
// @access  Private/Admin
export const updateAppConfig = async (req, res) => {
  let config = await AppConfig.findOneAndUpdate(
    { key: "global_dating_config" },
    { ...req.body, updatedBy: req.user._id },
    { new: true, upsert: true }
  );

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_APP_CONFIG",
    targetType: "AppConfig",
    details: req.body,
    req,
  });

  res.status(200).json({ message: "App configuration updated successfully", config });
};

// @desc    Public client endpoint to read active app limits & server status
// @route   GET /api/config/client
// @access  Public
export const getClientConfig = async (req, res) => {
  let config = await AppConfig.findOne({ key: "global_dating_config" }).lean();
  if (!config) {
    config = {
      freeDailySwipeLimit: 50,
      premiumDailySwipeLimit: 9999,
      freeSuperLikesPerWeek: 1,
      boostDurationMinutes: 30,
      defaultDiscoveryRadiusKm: 50,
      maxDiscoveryRadiusKm: 150,
      maintenanceMode: false,
      maintenanceNotice: "",
    };
  }

  res.status(200).json({
    limits: {
      freeDailySwipeLimit: config.freeDailySwipeLimit,
      premiumDailySwipeLimit: config.premiumDailySwipeLimit,
      freeSuperLikesPerWeek: config.freeSuperLikesPerWeek,
      boostDurationMinutes: config.boostDurationMinutes,
      defaultDiscoveryRadiusKm: config.defaultDiscoveryRadiusKm,
      maxDiscoveryRadiusKm: config.maxDiscoveryRadiusKm,
    },
    maintenance: {
      active: config.maintenanceMode || false,
      notice: config.maintenanceNotice || "",
    },
  });
};
