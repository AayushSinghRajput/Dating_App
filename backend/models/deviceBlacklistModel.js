import mongoose from "mongoose";

const deviceBlacklistSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      sparse: true,
      index: true,
    },
    hardwareFingerprint: {
      type: String,
      sparse: true,
      index: true,
    },
    ipAddress: {
      type: String,
      sparse: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    associatedAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const DeviceBlacklist = mongoose.model("DeviceBlacklist", deviceBlacklistSchema);
export default DeviceBlacklist;
