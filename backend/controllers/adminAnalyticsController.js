import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Transaction from "../models/transactionModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import RecommendationImpression from "../models/recommendationImpressionModel.js";
import RecommendationEvent from "../models/recommendationEventModel.js";
import { getVariantForUser, RANKING_WEIGHT_VARIANTS } from "../services/recommendation/rankingWeights.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function ratio(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null; // percentage, 1 decimal
}

// Section 31 — shared funnel formula, reused for both the overall funnel and
// each experiment variant's breakdown (Section 33) so the two stay
// comparable. `eventCounts` is a plain { TYPE: count } map.
function computeFunnel(impressionCount, eventCounts) {
  const likeCount = (eventCounts.LIKE || 0) + (eventCounts.SUPER_LIKE || 0);
  return {
    impressions: impressionCount,
    profileViewRate: ratio(eventCounts.PROFILE_VIEW || 0, impressionCount),
    likeRate: ratio(likeCount, impressionCount),
    passRate: ratio(eventCounts.PASS || 0, impressionCount),
    // Section 31's "mutual-like rate" — MATCH is only ever logged when both
    // sides liked, so this is the share of the viewer's own likes that
    // became a match.
    matchRate: ratio(eventCounts.MATCH || 0, likeCount),
    replyRate: ratio(eventCounts.MESSAGE_REPLIED || 0, eventCounts.MESSAGE_SENT || 0),
    sustainedConversationRate: ratio(eventCounts.SUSTAINED_CONVERSATION || 0, eventCounts.MATCH || 0),
  };
}

// @desc    Basic product analytics: signups, matches, DAU/WAU, 7-day retention
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalyticsSummary = async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [
    totalUsers,
    dau,
    wau,
    signupsByDayRaw,
    allProfiles,
    retentionCohort,
    exposureByUser,
    impressionCount30d,
    eventCountsRaw,
    engagedUserCountsRaw,
    impressionsByRequestingUserRaw,
    eventsByUserAndTypeRaw,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ lastActiveAt: { $gte: startOfToday } }),
    User.countDocuments({ lastActiveAt: { $gte: sevenDaysAgo } }),
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Profile.find({}).select("matches").lean(),
    // Cohort whose 7-day-post-signup window has fully elapsed
    User.find({
      createdAt: { $gte: thirtyDaysAgo, $lte: new Date(now.getTime() - 7 * DAY_MS) },
    })
      .select("createdAt lastActiveAt")
      .lean(),
    // Section 27 — recommendation exposure distribution over the last 30
    // days, most-shown first.
    RecommendationImpression.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$candidateUser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Section 31 — funnel denominator: how many candidates were actually
    // shown in the last 30 days.
    RecommendationImpression.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    // Section 31 — funnel numerators, one count per behavioral event type.
    RecommendationEvent.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
    // Section 31 "message initiation rate" — approximated as the share of
    // users with a MATCH event in-window who also logged a MESSAGE_SENT
    // event in-window (not raw message volume, which would overcount users
    // who sent many messages in one conversation).
    RecommendationEvent.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, type: { $in: ["MATCH", "MESSAGE_SENT"] } } },
      { $group: { _id: { type: "$type", user: "$user" } } },
      { $group: { _id: "$_id.type", count: { $sum: 1 } } },
    ]),
    // Section 33 — per-variant funnel breakdown. Bucketing is deterministic
    // per user (getVariantForUser), so grouping each user's own impressions
    // and events by their single stable variant gives an accurate
    // per-variant funnel without needing to correlate individual events back
    // to the impression that produced them.
    RecommendationImpression.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$requestingUser", count: { $sum: 1 } } },
    ]),
    RecommendationEvent.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { user: "$user", type: "$type" }, count: { $sum: 1 } } },
    ]),
  ]);

  // Each match is recorded symmetrically on both profiles, so divide by 2.
  const totalMatches = Math.floor(allProfiles.reduce((sum, p) => sum + p.matches.length, 0) / 2);

  const retainedCount = retentionCohort.filter((u) => {
    if (!u.lastActiveAt) return false;
    return u.lastActiveAt.getTime() - u.createdAt.getTime() >= 7 * DAY_MS;
  }).length;

  const retentionRate7d =
    retentionCohort.length > 0 ? Math.round((retainedCount / retentionCohort.length) * 100) : null;

  // Section 27 — how concentrated is exposure? What share of all
  // impressions went to the most-shown 10% of candidates, and who are they.
  let exposureConcentrationTop10Pct = null;
  let avgExposurePerShownUser = null;
  let topExposedUsers = [];
  if (exposureByUser.length > 0) {
    const totalImpressions = exposureByUser.reduce((sum, e) => sum + e.count, 0);
    avgExposurePerShownUser = Math.round(totalImpressions / exposureByUser.length);

    const top10PctCount = Math.max(1, Math.ceil(exposureByUser.length * 0.1));
    const top10PctImpressions = exposureByUser
      .slice(0, top10PctCount)
      .reduce((sum, e) => sum + e.count, 0);
    exposureConcentrationTop10Pct = Math.round((top10PctImpressions / totalImpressions) * 100);

    const topUserDocs = await User.find({ _id: { $in: exposureByUser.slice(0, 10).map((e) => e._id) } })
      .select("username")
      .lean();
    const usernameById = new Map(topUserDocs.map((u) => [u._id.toString(), u.username]));
    topExposedUsers = exposureByUser.slice(0, 10).map((e) => ({
      userId: e._id,
      username: usernameById.get(e._id.toString()) || "Unknown",
      impressions: e.count,
    }));
  }

  // Section 31 — recommendation funnel over the last 30 days. Rates are
  // percentages (0-100, 1 decimal), null when the denominator is 0 rather
  // than a misleading 0%.
  const eventCounts = Object.fromEntries(eventCountsRaw.map((e) => [e._id, e.count]));
  const engagedUserCounts = Object.fromEntries(engagedUserCountsRaw.map((e) => [e._id, e.count]));

  const recommendationFunnel = {
    ...computeFunnel(impressionCount30d, eventCounts),
    // Share of matched users who went on to send at least one message.
    // Both counts are windowed independently, so this can read above 100%
    // when users are actively messaging on matches formed before the
    // window started — that's a real (if odd-looking) signal, not a bug.
    messageInitiationRate: ratio(engagedUserCounts.MESSAGE_SENT || 0, engagedUserCounts.MATCH || 0),
  };

  // Section 33 — same funnel, split by each user's deterministically
  // assigned ranking-weight variant (see rankingWeights.js).
  const impressionCountByVariant = {};
  for (const row of impressionsByRequestingUserRaw) {
    const variant = getVariantForUser(row._id);
    impressionCountByVariant[variant] = (impressionCountByVariant[variant] || 0) + row.count;
  }
  const eventCountsByVariant = {};
  for (const row of eventsByUserAndTypeRaw) {
    const variant = getVariantForUser(row._id.user);
    eventCountsByVariant[variant] ??= {};
    eventCountsByVariant[variant][row._id.type] = (eventCountsByVariant[variant][row._id.type] || 0) + row.count;
  }
  const funnelByVariant = Object.fromEntries(
    Object.keys(RANKING_WEIGHT_VARIANTS).map((variant) => [
      variant,
      computeFunnel(impressionCountByVariant[variant] || 0, eventCountsByVariant[variant] || {}),
    ])
  );

  res.status(200).json({
    totalUsers,
    dau,
    wau,
    signupsByDay: signupsByDayRaw.map((d) => ({ date: d._id, count: d.count })),
    totalMatches,
    retentionRate7d,
    retentionCohortSize: retentionCohort.length,
    exposureConcentrationTop10Pct,
    avgExposurePerShownUser,
    shownUserCount: exposureByUser.length,
    topExposedUsers,
    recommendationFunnel,
    funnelByVariant,
  });
};

// ==========================================
// PHASE 3: BUSINESS INTELLIGENCE & ANALYTICS
// ==========================================

// @desc    11. Revenue Analytics: MRR, ARR, daily/monthly revenue trends, provider splits
// @route   GET /api/admin/analytics/revenue
// @access  Private/Admin
export const getRevenueAnalytics = async (req, res) => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const [
    totalRevenueRaw,
    completedTransactions,
    activeSubscribersCount,
    totalUsers,
    dailyRevenueRaw,
    monthlyRevenueRaw,
    providerBreakdownRaw,
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.countDocuments({ status: "completed" }),
    User.countDocuments({ isPremium: true, premiumExpiresAt: { $gt: now } }),
    User.countDocuments({}),
    Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: ninetyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$provider",
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalRevenue = totalRevenueRaw[0]?.total || 0;
  const MONTHLY_PRICE = 999; // Standard monthly plan in NPR
  const mrr = activeSubscribersCount * MONTHLY_PRICE;
  const arr = mrr * 12;

  const payingUsersCount = await Transaction.distinct("user", { status: "completed" });
  const arppu = payingUsersCount.length > 0 ? Math.round(totalRevenue / payingUsersCount.length) : 0;
  const arpu = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;

  res.status(200).json({
    totalRevenue,
    mrr,
    arr,
    completedTransactions,
    activeSubscribers: activeSubscribersCount,
    arpu,
    arppu,
    dailyRevenue: dailyRevenueRaw.map((d) => ({ date: d._id, revenue: d.revenue, count: d.transactions })),
    monthlyRevenue: monthlyRevenueRaw.map((m) => ({ month: m._id, revenue: m.revenue, count: m.transactions })),
    providerBreakdown: providerBreakdownRaw.map((p) => ({ provider: p._id || "other", revenue: p.revenue, count: p.count })),
  });
};

// @desc    12. User Cohort & Retention: Day 1, 7, 14, 30 retention rates
// @route   GET /api/admin/analytics/cohorts
// @access  Private/Admin
export const getCohortAnalytics = async (req, res) => {
  const now = Date.now();
  const cohorts = [];

  // Generate 8 weekly cohorts
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 7 * DAY_MS);
    const end = new Date(now - i * 7 * DAY_MS);

    const cohortUsers = await User.find({ createdAt: { $gte: start, $lt: end } })
      .select("createdAt lastActiveAt")
      .lean();

    const size = cohortUsers.length;
    let d1 = 0;
    let d7 = 0;
    let d14 = 0;
    let d30 = 0;

    cohortUsers.forEach((u) => {
      if (!u.lastActiveAt) return;
      const lifespan = u.lastActiveAt.getTime() - u.createdAt.getTime();
      if (lifespan >= 1 * DAY_MS) d1++;
      if (lifespan >= 7 * DAY_MS) d7++;
      if (lifespan >= 14 * DAY_MS) d14++;
      if (lifespan >= 30 * DAY_MS) d30++;
    });

    const isMature = (daysAgo) => now - start.getTime() >= daysAgo * DAY_MS;

    cohorts.push({
      cohort: `Wk ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      startDate: start.toISOString(),
      size,
      day1: size > 0 && isMature(1) ? Math.round((d1 / size) * 100) : null,
      day7: size > 0 && isMature(7) ? Math.round((d7 / size) * 100) : null,
      day14: size > 0 && isMature(14) ? Math.round((d14 / size) * 100) : null,
      day30: size > 0 && isMature(30) ? Math.round((d30 / size) * 100) : null,
    });
  }

  res.status(200).json({ cohorts });
};

// @desc    13. Lifecycle Conversion Funnel: Signup -> Profile -> Swiping -> Match -> Chat -> Subscriber
// @route   GET /api/admin/analytics/funnel
// @access  Private/Admin
export const getFunnelAnalytics = async (req, res) => {
  const [
    totalSignups,
    completedProfiles,
    activeSwipers,
    matchedUsers,
    activeChatters,
    paidSubscribers,
  ] = await Promise.all([
    User.countDocuments({}),
    Profile.countDocuments({
      name: { $exists: true, $ne: "" },
      profileImage: { $exists: true, $ne: "" },
    }),
    Profile.countDocuments({
      $or: [{ "likes.0": { $exists: true } }, { "passes.0": { $exists: true } }],
    }),
    Profile.countDocuments({ "matches.0": { $exists: true } }),
    Message.distinct("sender"),
    User.countDocuments({ isPremium: true }),
  ]);

  const steps = [
    { name: "Registered Account", count: totalSignups },
    { name: "Profile Completed", count: completedProfiles },
    { name: "Discovery Swiper", count: activeSwipers },
    { name: "Mutual Match Formed", count: matchedUsers },
    { name: "First Message Sent", count: activeChatters.length },
    { name: "Premium Subscriber", count: paidSubscribers },
  ];

  const enrichedSteps = steps.map((step, idx) => {
    const prevCount = idx === 0 ? step.count : steps[idx - 1].count;
    const overallRate = totalSignups > 0 ? Number(((step.count / totalSignups) * 100).toFixed(1)) : 100;
    const stepDropOff = prevCount > 0 ? Number((((prevCount - step.count) / prevCount) * 100).toFixed(1)) : 0;
    const conversionFromPrev = prevCount > 0 ? Number(((step.count / prevCount) * 100).toFixed(1)) : 0;

    return {
      ...step,
      overallConversionRate: overallRate,
      stepConversionRate: conversionFromPrev,
      dropOffRate: Math.max(0, stepDropOff),
    };
  });

  res.status(200).json({
    funnel: enrichedSteps,
    overallConversion: totalSignups > 0 ? Number(((paidSubscribers / totalSignups) * 100).toFixed(2)) : 0,
  });
};

// @desc    14. Geographic Heatmap & Density: User density by location/region
// @route   GET /api/admin/analytics/geo
// @access  Private/Admin
export const getGeoAnalytics = async (req, res) => {
  const [locationAggRaw, coordinatesProfiles, totalProfiles] = await Promise.all([
    Profile.aggregate([
      { $match: { location: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 },
          maleCount: { $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] } },
          femaleCount: { $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] } },
          verifiedCount: { $sum: { $cond: [{ $eq: ["$verified", true] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    Profile.find({
      "coordinates.coordinates": { $exists: true, $ne: [] },
    })
      .select("coordinates location name gender")
      .limit(200)
      .lean(),
    Profile.countDocuments({}),
  ]);

  const topLocations = locationAggRaw.map((loc) => ({
    city: loc._id,
    users: loc.count,
    percentage: totalProfiles > 0 ? Number(((loc.count / totalProfiles) * 100).toFixed(1)) : 0,
    male: loc.maleCount,
    female: loc.femaleCount,
    verified: loc.verifiedCount,
  }));

  const geoPoints = coordinatesProfiles
    .filter((p) => p.coordinates?.coordinates && p.coordinates.coordinates.length === 2)
    .map((p) => ({
      longitude: p.coordinates.coordinates[0],
      latitude: p.coordinates.coordinates[1],
      city: p.location || "Nearby",
      gender: p.gender || "other",
    }));

  res.status(200).json({
    topLocations,
    geoPoints,
    totalWithLocation: locationAggRaw.reduce((sum, l) => sum + l.count, 0),
    totalProfiles,
  });
};

// @desc    15. Match Quality Metrics: Mutual match rate, chat start rate, sustained convos
// @route   GET /api/admin/analytics/match-quality
// @access  Private/Admin
export const getMatchQualityMetrics = async (req, res) => {
  const [profiles, totalChats, messagesCount, messageStatsRaw] = await Promise.all([
    Profile.find({}).select("likes superLikes matches").lean(),
    Chat.countDocuments({}),
    Message.countDocuments({ deleted: false }),
    Message.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: "$chat", messageCount: { $sum: 1 } } },
    ]),
  ]);

  const totalLikesSent = profiles.reduce((sum, p) => sum + (p.likes?.length || 0) + (p.superLikes?.length || 0), 0);
  const totalMatchesFormed = Math.floor(profiles.reduce((sum, p) => sum + (p.matches?.length || 0), 0) / 2);

  const mutualMatchRate = totalLikesSent > 0 ? Number(((totalMatchesFormed / totalLikesSent) * 100).toFixed(1)) : 0;

  const chatsWithMessages = messageStatsRaw.length;
  const conversationStartRate = totalMatchesFormed > 0
    ? Number((Math.min(100, (chatsWithMessages / totalMatchesFormed) * 100)).toFixed(1))
    : 0;

  const deepConversationsCount = messageStatsRaw.filter((c) => c.messageCount >= 10).length;
  const deepConversationRate = totalChats > 0
    ? Number(((deepConversationsCount / totalChats) * 100).toFixed(1))
    : 0;

  const avgMessagesPerChat = totalChats > 0 ? Number((messagesCount / totalChats).toFixed(1)) : 0;

  res.status(200).json({
    totalLikesSent,
    totalMatchesFormed,
    mutualMatchRate,
    totalChats,
    chatsWithMessages,
    conversationStartRate,
    messagesCount,
    avgMessagesPerChat,
    deepConversationsCount,
    deepConversationRate,
  });
};

// @desc    16. Swipe Fatigue Tracker: Identifies users with high swipe activity / low match return
// @route   GET /api/admin/analytics/swipe-fatigue
// @access  Private/Admin
export const getSwipeFatigueTracker = async (req, res) => {
  const profiles = await Profile.find({})
    .populate("user", "username email lastActiveAt isPremium banned")
    .select("user name profileImage likes passes matches superLikes likesUsedToday")
    .lean();

  let totalRightSwipes = 0;
  let totalLeftSwipes = 0;
  const candidates = [];

  profiles.forEach((p) => {
    const right = (p.likes?.length || 0) + (p.superLikes?.length || 0);
    const left = p.passes?.length || 0;
    const totalSwipes = right + left;
    const matchCount = p.matches?.length || 0;

    totalRightSwipes += right;
    totalLeftSwipes += left;

    // Fatigue risk: High volume swipers (>= 20 total swipes) with < 8% match return
    const matchRate = right > 0 ? Number(((matchCount / right) * 100).toFixed(1)) : 0;
    const likeRatio = totalSwipes > 0 ? Number(((right / totalSwipes) * 100).toFixed(1)) : 0;

    if (totalSwipes >= 15 && matchRate <= 10) {
      candidates.push({
        profileId: p._id,
        user: p.user,
        name: p.name || p.user?.username || "Dater",
        profileImage: p.profileImage,
        totalSwipes,
        rightSwipes: right,
        leftSwipes: left,
        matches: matchCount,
        matchRate,
        likeRatio,
        fatigueScore: Math.min(100, Math.round((totalSwipes / Math.max(1, matchCount + 1)) * 2)),
      });
    }
  });

  candidates.sort((a, b) => b.fatigueScore - a.fatigueScore);

  const totalSwipesOverall = totalRightSwipes + totalLeftSwipes;
  const overallRightSwipeRatio = totalSwipesOverall > 0
    ? Number(((totalRightSwipes / totalSwipesOverall) * 100).toFixed(1))
    : 50;

  res.status(200).json({
    overallRightSwipeRatio,
    totalRightSwipes,
    totalLeftSwipes,
    fatiguedCount: candidates.length,
    fatiguedUsers: candidates.slice(0, 20),
  });
};

