import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, enum: ["user", "admin"], required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: ["account", "billing", "safety", "bug", "feature", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    replies: [replySchema],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: -1, createdAt: -1 });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
