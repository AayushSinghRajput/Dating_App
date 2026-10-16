import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["info", "warning", "celebration", "maintenance", "promotion"],
      default: "info",
    },
    targetSegment: {
      type: String,
      enum: ["all", "free", "premium", "new_users"],
      default: "all",
    },
    ctaText: {
      type: String,
      default: "",
    },
    ctaLink: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1, // higher shows first
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

announcementSchema.index({ active: 1, priority: -1, createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
