import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
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
