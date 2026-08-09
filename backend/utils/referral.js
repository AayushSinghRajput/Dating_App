import crypto from "crypto";
import User from "../models/userModel.js";

const REFERRAL_PREMIUM_DAYS = 3;

export async function generateUniqueReferralCode() {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase();
    exists = await User.exists({ referralCode: code });
  }
  return code;
}

// Grants the referrer a short premium extension for each successful referral,
// stacking on top of any remaining premium time they already have.
export async function applyReferralReward(referrerId) {
  const referrer = await User.findById(referrerId);
  if (!referrer) return;

  const now = new Date();
  const currentExpiry =
    referrer.premiumExpiresAt && referrer.premiumExpiresAt > now
      ? referrer.premiumExpiresAt
      : now;

  referrer.premiumExpiresAt = new Date(
    currentExpiry.getTime() + REFERRAL_PREMIUM_DAYS * 24 * 60 * 60 * 1000
  );
  referrer.isPremium = true;
  referrer.referralCount = (referrer.referralCount || 0) + 1;
  await referrer.save();
}
