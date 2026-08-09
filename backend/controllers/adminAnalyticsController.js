import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// @desc    Basic product analytics: signups, matches, DAU/WAU, 7-day retention
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getAnalyticsSummary = async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [totalUsers, dau, wau, signupsByDayRaw, allProfiles, retentionCohort] = await Promise.all([
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
  ]);

  // Each match is recorded symmetrically on both profiles, so divide by 2.
  const totalMatches = Math.floor(allProfiles.reduce((sum, p) => sum + p.matches.length, 0) / 2);

  const retainedCount = retentionCohort.filter((u) => {
    if (!u.lastActiveAt) return false;
    return u.lastActiveAt.getTime() - u.createdAt.getTime() >= 7 * DAY_MS;
  }).length;

  const retentionRate7d =
    retentionCohort.length > 0 ? Math.round((retainedCount / retentionCohort.length) * 100) : null;

  res.status(200).json({
    totalUsers,
    dau,
    wau,
    signupsByDay: signupsByDayRaw.map((d) => ({ date: d._id, count: d.count })),
    totalMatches,
    retentionRate7d,
    retentionCohortSize: retentionCohort.length,
  });
};
