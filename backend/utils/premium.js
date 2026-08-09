import User from "../models/userModel.js";

export const FREE_DAILY_LIKES = 20;
export const FREE_DAILY_SUPER_LIKES = 1;
export const PREMIUM_DAILY_SUPER_LIKES = 5;
export const BOOST_DURATION_MINUTES = 30;
export const BOOST_COOLDOWN_HOURS = 24;

export async function isUserPremium(userId) {
  const user = await User.findById(userId).select("isPremium premiumExpiresAt");
  if (!user?.isPremium) return false;
  if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) return false;
  return true;
}

// Resets a daily usage counter back to 0 the first time it's touched on a new
// calendar day, so callers don't need their own day-boundary bookkeeping.
export function resetIfNewDay(doc, usedField, dateField) {
  const today = new Date();
  const lastDate = doc[dateField];
  if (!lastDate || lastDate.toDateString() !== today.toDateString()) {
    doc[usedField] = 0;
    doc[dateField] = today;
  }
}
