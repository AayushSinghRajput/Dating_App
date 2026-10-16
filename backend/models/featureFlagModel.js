import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    rolloutPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    minimumAppVersion: {
      type: String,
      default: "1.0.0",
    },
    targetTiers: {
      type: [String],
      enum: ["free", "premium"],
      default: ["free", "premium"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const FeatureFlag = mongoose.model("FeatureFlag", featureFlagSchema);
export default FeatureFlag;
