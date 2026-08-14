import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import RecommendationImpression from "../models/recommendationImpressionModel.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// @desc    Basic product analytics: signups, matches, DAU/WAU, 7-day retention
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalyticsSummary = async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [totalUsers, dau, wau, signupsByDayRaw, allProfiles, retentionCohort, exposureByUser] = await Promise.all([
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
  });
};
