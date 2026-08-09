import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "call", "audio", "image", "video"],
      default: "text",
    },
    text: {
      type: String,
      required: function () {
        return this.type === "text";
      },
    },
    call: {
      callType: { type: String, enum: ["audio", "video"] },
      status: { type: String, enum: ["answered", "missed", "rejected"] },
      duration: { type: Number, default: 0 },
      caller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    audio: {
      url: { type: String },
      duration: { type: Number, default: 0 },
    },
    media: {
      url: { type: String },
    },
    read: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

// getMessages filters by chat and sorts by createdAt on every chat open —
// this compound index covers that access pattern directly.
messageSchema.index({ chat: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
