import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import {
  isUserPremium,
  resetIfNewDay,
  FREE_DAILY_LIKES,
  FREE_DAILY_SUPER_LIKES,
  PREMIUM_DAILY_SUPER_LIKES,
  BOOST_DURATION_MINUTES,
  BOOST_COOLDOWN_HOURS,
} from "../utils/premium.js";

// @desc    Get the logged-in user's premium status and daily swipe quotas
// @route   GET /api/premium/status
// @access  Private
export const getPremiumStatus = async (req, res) => {
  const userId = req.user.id;
  const [user, profile] = await Promise.all([
    User.findById(userId).select("isPremium premiumExpiresAt").lean(),
    Profile.findOne({ user: userId }).select(
      "likesUsedToday likesDate superLikesUsedToday superLikesDate boostedUntil"
    ),
  ]);

  const premium = await isUserPremium(userId);

  if (profile) {
    resetIfNewDay(profile, "likesUsedToday", "likesDate");
    resetIfNewDay(profile, "superLikesUsedToday", "superLikesDate");
  }

  const superLikeLimit = premium ? PREMIUM_DAILY_SUPER_LIKES : FREE_DAILY_SUPER_LIKES;
  const likesUsedToday = profile?.likesUsedToday || 0;
  const superLikesUsedToday = profile?.superLikesUsedToday || 0;
  const boostedUntil = profile?.boostedUntil || null;

  res.status(200).json({
    isPremium: premium,
    premiumExpiresAt: user?.premiumExpiresAt || null,
    likesUsedToday,
    likesRemaining: premium ? null : Math.max(0, FREE_DAILY_LIKES - likesUsedToday),
    superLikesUsedToday,
    superLikesRemaining: Math.max(0, superLikeLimit - superLikesUsedToday),
    boostedUntil,
    boostActive: !!(boostedUntil && boostedUntil > new Date()),
  });
};

// @desc    Activate a temporary discovery boost (Premium only, once per cooldown window)
// @route   POST /api/premium/boost
// @access  Private
export const activateBoost = async (req, res) => {
  const userId = req.user.id;
  const premium = await isUserPremium(userId);
  if (!premium) {
    return res.status(403).json({ message: "Boost is a Premium feature. Upgrade to boost your profile." });
  }

  const profile = await Profile.findOne({ user: userId });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const now = new Date();
  if (profile.lastBoostActivatedAt) {
    const cooldownEnds = new Date(
      profile.lastBoostActivatedAt.getTime() + BOOST_COOLDOWN_HOURS * 60 * 60 * 1000
    );
    if (now < cooldownEnds) {
      return res.status(403).json({
        message: "You can only boost once every 24 hours. Try again later.",
        nextAvailableAt: cooldownEnds,
      });
    }
  }

  profile.boostedUntil = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);
  profile.lastBoostActivatedAt = now;
  await profile.save();

  res.status(200).json({ message: "Boost activated!", boostedUntil: profile.boostedUntil });
};
