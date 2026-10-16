import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_dating_config",
    },
    freeDailySwipeLimit: {
      type: Number,
      default: 50,
    },
    premiumDailySwipeLimit: {
      type: Number,
      default: 9999,
    },
    freeSuperLikesPerWeek: {
      type: Number,
      default: 1,
    },
    boostDurationMinutes: {
      type: Number,
      default: 30,
    },
    defaultDiscoveryRadiusKm: {
      type: Number,
      default: 50,
    },
    maxDiscoveryRadiusKm: {
      type: Number,
      default: 150,
    },
    matchExpirationDays: {
      type: Number,
      default: 14,
    },
    chatAudioNotesMaxSeconds: {
      type: Number,
      default: 60,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceNotice: {
      type: String,
      default: "We are currently upgrading Soulmate servers. Back online shortly!",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const AppConfig = mongoose.model("AppConfig", appConfigSchema);
export default AppConfig;
