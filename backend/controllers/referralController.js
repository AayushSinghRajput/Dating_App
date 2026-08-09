import User from "../models/userModel.js";
import { generateUniqueReferralCode } from "../utils/referral.js";

// @desc    Get the logged-in user's referral code and stats
// @route   GET /api/referrals/me
// @access  Private
export const getReferralInfo = async (req, res) => {
  const user = await User.findById(req.user.id).select("referralCode referralCount");

  // Backfill for accounts created before the referral program existed.
  if (!user.referralCode) {
    user.referralCode = await generateUniqueReferralCode();
    await user.save();
  }

  res.status(200).json({
    referralCode: user.referralCode,
    referralCount: user.referralCount,
  });
};
