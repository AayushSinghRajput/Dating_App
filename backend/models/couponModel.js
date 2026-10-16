import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat_amount"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },
    applicableTiers: {
      type: [String],
      enum: ["all", "plus", "gold", "platinum"],
      default: ["all"],
    },
    maxRedemptions: {
      type: Number,
      default: 100,
    },
    currentRedemptions: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
