import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    planId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    tier: {
      type: String,
      enum: ["plus", "gold", "platinum"],
      required: true,
    },
    billingInterval: {
      type: String,
      enum: ["monthly", "quarterly", "annual"],
      default: "monthly",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    perks: {
      likesPerDay: { type: Number, default: 9999 },
      superLikesPerMonth: { type: Number, default: 5 },
      rewindsPerMonth: { type: Number, default: 9999 },
      seeWhoLikedYou: { type: Boolean, default: true },
      priorityMatches: { type: Boolean, default: false },
      passportMode: { type: Boolean, default: false },
    },
    active: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
