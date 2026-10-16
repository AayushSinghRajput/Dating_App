import mongoose from "mongoose";

const deletionRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      default: "User requested account deletion",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

deletionRequestSchema.index({ status: 1, createdAt: -1 });
deletionRequestSchema.index({ user: 1 });

const DeletionRequest = mongoose.model("DeletionRequest", deletionRequestSchema);
export default DeletionRequest;
