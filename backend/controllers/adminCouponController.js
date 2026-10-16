import Coupon from "../models/couponModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
export const listCoupons = async (req, res) => {
  const coupons = await Coupon.find({})
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ coupons });
};

// @desc    Create a new coupon code
// @route   POST /api/admin/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  const {
    code,
    discountType = "percentage",
    discountValue,
    applicableTiers = ["all"],
    maxRedemptions = 100,
    expiresAt,
    active = true,
  } = req.body;

  if (!code || !discountValue || !expiresAt) {
    return res.status(400).json({ message: "Code, discount value, and expiration date are required." });
  }

  const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    return res.status(400).json({ message: `Coupon with code "${code}" already exists.` });
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    applicableTiers,
    maxRedemptions: Number(maxRedemptions) || 100,
    expiresAt: new Date(expiresAt),
    active,
    createdBy: req.user._id,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_COUPON",
    targetType: "Coupon",
    details: { code: coupon.code, discountValue: coupon.discountValue },
    req,
  });

  res.status(201).json({ message: "Coupon code created successfully", coupon });
};

// @desc    Update or toggle coupon
// @route   PATCH /api/admin/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_COUPON",
    targetType: "Coupon",
    details: { code: coupon.code, active: coupon.active },
    req,
  });

  res.status(200).json({ message: "Coupon updated", coupon });
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) return res.status(404).json({ message: "Coupon not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_COUPON",
    targetType: "Coupon",
    details: { code: coupon.code },
    req,
  });

  res.status(200).json({ message: "Coupon deleted", id });
};

// @desc    Validate a promo code at checkout (User-facing)
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  const { code, tier = "plus" } = req.body;
  if (!code) return res.status(400).json({ message: "Please provide a coupon code." });

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  if (!coupon) {
    return res.status(404).json({ message: "Invalid or inactive promo code." });
  }

  if (new Date() > new Date(coupon.expiresAt)) {
    return res.status(400).json({ message: "This promo code has expired." });
  }

  if (coupon.currentRedemptions >= coupon.maxRedemptions) {
    return res.status(400).json({ message: "This promo code has reached its maximum redemptions." });
  }

  if (!coupon.applicableTiers.includes("all") && !coupon.applicableTiers.includes(tier)) {
    return res.status(400).json({ message: `This code is only valid for tiers: ${coupon.applicableTiers.join(", ")}` });
  }

  res.status(200).json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
};
