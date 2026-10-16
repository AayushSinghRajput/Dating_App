import Plan from "../models/planModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

const DEFAULT_PLANS = [
  {
    planId: "soulmate_plus_monthly",
    name: "Soulmate Plus",
    tier: "plus",
    billingInterval: "monthly",
    price: 9.99,
    currency: "USD",
    discountPercentage: 0,
    perks: {
      likesPerDay: 9999,
      superLikesPerMonth: 5,
      rewindsPerMonth: 9999,
      seeWhoLikedYou: false,
      priorityMatches: false,
      passportMode: false,
    },
    active: true,
    isPopular: false,
  },
  {
    planId: "soulmate_gold_quarterly",
    name: "Soulmate Gold",
    tier: "gold",
    billingInterval: "quarterly",
    price: 24.99,
    currency: "USD",
    discountPercentage: 15,
    perks: {
      likesPerDay: 9999,
      superLikesPerMonth: 15,
      rewindsPerMonth: 9999,
      seeWhoLikedYou: true,
      priorityMatches: true,
      passportMode: false,
    },
    active: true,
    isPopular: true,
  },
  {
    planId: "soulmate_platinum_annual",
    name: "Soulmate Platinum VIP",
    tier: "platinum",
    billingInterval: "annual",
    price: 79.99,
    currency: "USD",
    discountPercentage: 35,
    perks: {
      likesPerDay: 9999,
      superLikesPerMonth: 30,
      rewindsPerMonth: 9999,
      seeWhoLikedYou: true,
      priorityMatches: true,
      passportMode: true,
    },
    active: true,
    isPopular: false,
  },
];

// @desc    List all subscription plans (seeds defaults if none exist)
// @route   GET /api/admin/plans
// @access  Private/Admin
export const listPlans = async (req, res) => {
  let plans = await Plan.find({}).sort({ price: 1 }).lean();

  if (plans.length === 0) {
    await Plan.insertMany(DEFAULT_PLANS);
    plans = await Plan.find({}).sort({ price: 1 }).lean();
  }

  res.status(200).json({ plans });
};

// @desc    Create a new subscription plan
// @route   POST /api/admin/plans
// @access  Private/Admin
export const createPlan = async (req, res) => {
  const { planId, name, tier, billingInterval, price, currency = "USD", discountPercentage = 0, perks = {}, active = true, isPopular = false } = req.body;

  if (!planId || !name || price === undefined) {
    return res.status(400).json({ message: "Plan ID, Name, and Price are required" });
  }

  const existing = await Plan.findOne({ planId: planId.trim() });
  if (existing) {
    return res.status(400).json({ message: `Plan with ID "${planId}" already exists.` });
  }

  const plan = await Plan.create({
    planId: planId.trim(),
    name,
    tier,
    billingInterval,
    price: Number(price),
    currency,
    discountPercentage: Number(discountPercentage) || 0,
    perks,
    active,
    isPopular,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_SUBSCRIPTION_PLAN",
    targetType: "Plan",
    details: { planId: plan.planId, price: plan.price },
    req,
  });

  res.status(201).json({ message: "Subscription plan created", plan });
};

// @desc    Update subscription plan
// @route   PATCH /api/admin/plans/:id
// @access  Private/Admin
export const updatePlan = async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
  if (!plan) return res.status(404).json({ message: "Plan not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_SUBSCRIPTION_PLAN",
    targetType: "Plan",
    details: { planId: plan.planId, price: plan.price, active: plan.active },
    req,
  });

  res.status(200).json({ message: "Subscription plan updated", plan });
};

// @desc    Delete subscription plan
// @route   DELETE /api/admin/plans/:id
// @access  Private/Admin
export const deletePlan = async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) return res.status(404).json({ message: "Plan not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_SUBSCRIPTION_PLAN",
    targetType: "Plan",
    details: { planId: plan.planId },
    req,
  });

  res.status(200).json({ message: "Plan deleted", id });
};

// @desc    Client-facing endpoint to fetch active plans for mobile paywall
// @route   GET /api/plans/active
// @access  Public
export const getActivePlans = async (req, res) => {
  const plans = await Plan.find({ active: true }).sort({ price: 1 }).lean();
  res.status(200).json({ plans });
};
