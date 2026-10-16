import mongoose from "mongoose";

const emailCampaignSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    previewText: {
      type: String,
      default: "",
    },
    contentHtml: {
      type: String,
      required: true,
    },
    targetSegment: {
      type: String,
      enum: ["all", "inactive", "free_users", "unverified"],
      default: "all",
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "scheduled"],
      default: "draft",
    },
    sentAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

emailCampaignSchema.index({ createdAt: -1 });

const EmailCampaign = mongoose.model("EmailCampaign", emailCampaignSchema);
export default EmailCampaign;
