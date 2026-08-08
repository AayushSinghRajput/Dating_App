import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: ["inappropriate_content", "fake_profile", "harassment", "spam", "other"],
      required: true,
    },
    details: {
      type: String,
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "actioned", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
