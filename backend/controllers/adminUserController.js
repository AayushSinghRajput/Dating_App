import mongoose from "mongoose";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Report from "../models/reportModel.js";
import Transaction from "../models/transactionModel.js";
import Chat from "../models/chatModel.js";
import { notifyBannedUser } from "../utils/notify.js";
import { logAdminAction } from "../utils/auditLogger.js";

const PAGE_SIZE = 25;

// @desc    List/search users with server-side pagination & status filters
// @route   GET /api/admin/users?search=&page=&status=
// @access  Private/Admin
export const listUsers = async (req, res) => {
  const { search = "", page = "1", status = "all" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const filter = {};

  if (search.trim()) {
    const isObjectId =
      mongoose.Types.ObjectId.isValid(search.trim()) && search.trim().length === 24;
    const matchingProfiles = await Profile.find({
      name: { $regex: search.trim(), $options: "i" },
    })
      .select("user")
      .lean();
    const userIdsFromName = matchingProfiles.map((p) => p.user);

    filter.$or = [
      { username: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
      { _id: { $in: userIdsFromName } },
    ];

    if (isObjectId) {
      filter.$or.push({ _id: search.trim() });
    }
  }

  if (status === "banned") {
    filter.banned = true;
  } else if (status === "active") {
    filter.banned = false;
  } else if (status === "frozen") {
    filter.frozen = true;
  } else if (status === "premium") {
    filter.isPremium = true;
  } else if (status === "admin") {
    filter.isAdmin = true;
  } else if (status === "inactive") {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    filter.$or = [
      { lastActiveAt: { $lt: sixtyDaysAgo } },
      { lastActiveAt: null, createdAt: { $lt: sixtyDaysAgo } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("username email createdAt banned frozen isPremium isAdmin lastActiveAt")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user name profileImage photos verified")
    .lean();

  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.user.toString()] = p;
  });

  const usersWithProfile = users.map((u) => ({
    ...u,
    profile: profileMap[u._id.toString()] || null,
  }));

  res.status(200).json({ users: usersWithProfile, total, page: pageNum, pageSize: PAGE_SIZE });
};

// @desc    Ban a user (blocks all further authenticated requests)
// @route   POST /api/admin/users/:userId/ban
// @access  Private/Admin
export const banUser = async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (userId === req.user.id) {
    return res.status(400).json({ message: "You can't ban yourself." });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { banned: true, bannedAt: new Date(), banReason: reason || "" },
    { new: true }
  ).select("username email banned");

  if (!user) return res.status(404).json({ message: "User not found" });

  notifyBannedUser(req.app.get("io"), userId, reason);

  await logAdminAction({
    adminId: req.user._id,
    action: "BAN_USER",
    targetId: userId,
    targetType: "User",
    details: { username: user.username, email: user.email, reason },
    req,
  });

  res.status(200).json({ message: "User banned", user });
};

// @desc    Lift a ban
// @route   POST /api/admin/users/:userId/unban
// @access  Private/Admin
export const unbanUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { banned: false, bannedAt: undefined, banReason: undefined },
    { new: true }
  ).select("username email banned");

  if (!user) return res.status(404).json({ message: "User not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UNBAN_USER",
    targetId: req.params.userId,
    targetType: "User",
    details: { username: user.username, email: user.email },
    req,
  });

  res.status(200).json({ message: "User unbanned", user });
};

// @desc    View a user's complete profile, account details, stats, reports, transactions, matches & chats
// @route   GET /api/admin/users/:userId/profile
// @access  Private/Admin
export const getUserProfile = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select("-password -emailVerificationCode -resetPasswordToken -resetPasswordExpires")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "User account not found." });
  }

  const [profile, reports, transactions, userChats] = await Promise.all([
    Profile.findOne({ user: userId })
      .populate({
        path: "matches",
        select: "user name profileImage photos age location verified gender profession",
        populate: { path: "user", select: "username email lastActiveAt isPremium banned" },
      })
      .populate({
        path: "likes",
        select: "user name profileImage photos age location verified gender profession",
        populate: { path: "user", select: "username email lastActiveAt" },
      })
      .lean(),
    Report.find({ reportedUser: userId })
      .populate("reporter", "username email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Chat.find({ participants: userId })
      .populate("participants", "username email isPremium banned")
      .populate("lastMessage")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
  ]);

  // Enrich chats with the other participant's profile image and display name
  const otherUserIds = userChats
    .flatMap((c) => c.participants.map((p) => p._id.toString()))
    .filter((id) => id !== userId);
  const otherProfiles = await Profile.find({ user: { $in: otherUserIds } })
    .select("user name profileImage photos")
    .lean();
  const profileLookup = Object.fromEntries(
    otherProfiles.map((p) => [p.user.toString(), p])
  );

  const enrichedChats = userChats.map((c) => {
    const otherParticipant = c.participants.find((p) => p._id.toString() !== userId);
    return {
      ...c,
      otherParticipant,
      otherProfile: otherParticipant
        ? profileLookup[otherParticipant._id.toString()] || null
        : null,
    };
  });

  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = {
    matchesCount: profile?.matches?.length || 0,
    likesCount: profile?.likes?.length || 0,
    passesCount: profile?.passes?.length || 0,
    superLikesCount: profile?.superLikes?.length || 0,
    chatsCount: userChats.length,
    reportsCount: reports.length,
    transactionsCount: transactions.length,
    totalSpent,
    likesUsedToday: profile?.likesUsedToday || 0,
    superLikesUsedToday: profile?.superLikesUsedToday || 0,
    boostedUntil: profile?.boostedUntil || null,
    lastBoostActivatedAt: profile?.lastBoostActivatedAt || null,
    lastSwipe: profile?.lastSwipe || null,
  };

  res.status(200).json({
    user,
    profile,
    stats,
    reports,
    transactions,
    chats: enrichedChats,
  });
};

// @desc    Remove a photo from a user's profile (moderation action)
// @route   DELETE /api/admin/users/:userId/photo
// @access  Private/Admin
export const removeUserPhoto = async (req, res) => {
  const { userId } = req.params;
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Photo url is required" });

  const profile = await Profile.findOne({ user: userId });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  profile.photos = profile.photos.filter((p) => p !== url);
  if (profile.profileImage === url) {
    profile.profileImage = profile.photos[0] || "";
  }
  await profile.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_USER_PHOTO",
    targetId: userId,
    targetType: "Profile",
    details: { photoUrl: url },
    req,
  });

  res.status(200).json({ message: "Photo removed", photos: profile.photos });
};

// @desc    Emergency freeze — suspends all activity without a full ban
// @route   PATCH /api/admin/users/:userId/freeze
// @access  Private/Admin
export const freezeUser = async (req, res) => {
  const { userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot freeze yourself." });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { frozen: true, frozenAt: new Date(), frozenReason: req.body.reason || "" },
    { new: true }
  ).select("username email frozen frozenAt frozenReason");

  if (!user) return res.status(404).json({ message: "User not found" });

  // Kick them from active sockets
  req.app.get("io")?.to(userId).emit("accountFrozen", {
    message: "Your account has been temporarily frozen by an administrator.",
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "FREEZE_USER",
    targetId: userId,
    targetType: "User",
    details: { username: user.username, reason: req.body.reason },
    req,
  });

  res.status(200).json({ message: "User frozen", user });
};

// @desc    Unfreeze an account
// @route   PATCH /api/admin/users/:userId/unfreeze
// @access  Private/Admin
export const unfreezeUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { frozen: false, frozenAt: undefined, frozenReason: undefined },
    { new: true }
  ).select("username email frozen");

  if (!user) return res.status(404).json({ message: "User not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UNFREEZE_USER",
    targetId: req.params.userId,
    targetType: "User",
    details: { username: user.username },
    req,
  });

  res.status(200).json({ message: "User unfrozen", user });
};

// @desc    List premium subscriptions
// @route   GET /api/admin/subscriptions?status=&search=&page=
// @access  Private/Admin
export const listSubscriptions = async (req, res) => {
  const { status = "all", search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 25;

  const filter = {};
  if (status === "active") {
    filter.isPremium = true;
    filter.premiumExpiresAt = { $gt: new Date() };
  } else if (status === "expired") {
    filter.isPremium = false;
  }

  if (search.trim()) {
    filter.$or = [
      { username: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("username email isPremium premiumExpiresAt createdAt")
      .sort({ premiumExpiresAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((u) => u._id);
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user name profileImage")
    .lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const enriched = users.map((u) => ({
    ...u,
    profile: profileMap[u._id.toString()] || null,
  }));

  res.status(200).json({ subscriptions: enriched, total, page: pageNum, pageSize });
};

// @desc    Extend or revoke a user's premium subscription
// @route   PATCH /api/admin/subscriptions/:userId
// @access  Private/Admin
export const updateSubscription = async (req, res) => {
  const { action, days } = req.body; // action: "extend" | "revoke"

  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (action === "revoke") {
    user.isPremium = false;
    user.premiumExpiresAt = null;
  } else if (action === "extend") {
    const extraMs = (parseInt(days, 10) || 30) * 24 * 60 * 60 * 1000;
    const base = user.isPremium && user.premiumExpiresAt > new Date()
      ? new Date(user.premiumExpiresAt)
      : new Date();
    user.isPremium = true;
    user.premiumExpiresAt = new Date(base.getTime() + extraMs);
  } else {
    return res.status(400).json({ message: "action must be 'extend' or 'revoke'" });
  }

  await user.save();

  await logAdminAction({
    adminId: req.user._id,
    action: action === "revoke" ? "REVOKE_PREMIUM" : "EXTEND_PREMIUM",
    targetId: user._id,
    targetType: "User",
    details: { username: user.username, days, premiumExpiresAt: user.premiumExpiresAt },
    req,
  });

  res.status(200).json({ message: `Subscription ${action}d`, user: { _id: user._id, isPremium: user.isPremium, premiumExpiresAt: user.premiumExpiresAt } });
};

// @desc    Toggle verified blue badge for user profile
// @route   PATCH /api/admin/users/:userId/verify
// @access  Private/Admin
export const toggleUserVerification = async (req, res) => {
  const { userId } = req.params;
  const { verified } = req.body;

  const profile = await Profile.findOneAndUpdate(
    { user: userId },
    { verified: Boolean(verified) },
    { new: true }
  ).populate("user", "username email");

  if (!profile) return res.status(404).json({ message: "Profile not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: verified ? "VERIFY_USER" : "UNVERIFY_USER",
    targetId: userId,
    targetType: "Profile",
    details: { username: profile.user?.username, verified: Boolean(verified) },
    req,
  });

  res.status(200).json({
    message: verified ? "Verified badge granted" : "Verified badge revoked",
    profile: { _id: profile._id, user: profile.user, verified: profile.verified },
  });
};

// @desc    Perform bulk actions on multiple users (ban, unban, freeze, unfreeze, verify, unverify)
// @route   POST /api/admin/users/bulk
// @access  Private/Admin
export const bulkUserAction = async (req, res) => {
  const { userIds, action, reason } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "userIds array is required and must not be empty" });
  }

  // Prevent self-action on admin
  const filteredIds = userIds.filter((id) => id !== req.user.id);

  let modifiedCount = 0;

  switch (action) {
    case "ban": {
      const banRes = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { banned: true, bannedAt: new Date(), banReason: reason || "Bulk administrative ban" } }
      );
      modifiedCount = banRes.modifiedCount;
      filteredIds.forEach((id) => notifyBannedUser(req.app.get("io"), id, reason));
      break;
    }

    case "unban": {
      const unbanRes = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { banned: false }, $unset: { bannedAt: "", banReason: "" } }
      );
      modifiedCount = unbanRes.modifiedCount;
      break;
    }

    case "freeze": {
      const freezeRes = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { frozen: true, frozenAt: new Date(), frozenReason: reason || "Bulk account freeze" } }
      );
      modifiedCount = freezeRes.modifiedCount;
      break;
    }

    case "unfreeze": {
      const unfreezeRes = await User.updateMany(
        { _id: { $in: filteredIds } },
        { $set: { frozen: false }, $unset: { frozenAt: "", frozenReason: "" } }
      );
      modifiedCount = unfreezeRes.modifiedCount;
      break;
    }

    case "verify": {
      const verifyRes = await Profile.updateMany(
        { user: { $in: filteredIds } },
        { $set: { verified: true } }
      );
      modifiedCount = verifyRes.modifiedCount;
      break;
    }

    case "unverify": {
      const unverifyRes = await Profile.updateMany(
        { user: { $in: filteredIds } },
        { $set: { verified: false } }
      );
      modifiedCount = unverifyRes.modifiedCount;
      break;
    }

    default:
      return res.status(400).json({ message: "Invalid action. Supported: ban, unban, freeze, unfreeze, verify, unverify" });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: `BULK_${action.toUpperCase()}`,
    targetType: "User",
    details: { count: modifiedCount, totalRequested: userIds.length, reason },
    req,
  });

  res.status(200).json({
    message: `Bulk ${action} applied successfully to ${modifiedCount} user(s).`,
    modifiedCount,
  });
};

// @desc    Get inactive users statistics (30d+, 60d+, 90d+)
// @route   GET /api/admin/users/inactive/stats
// @access  Private/Admin
export const getInactiveUsersStats = async (req, res) => {
  const now = Date.now();
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const d90 = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const [inactive30, inactive60, inactive90, totalUsers] = await Promise.all([
    User.countDocuments({
      banned: false,
      $or: [{ lastActiveAt: { $lt: d30 } }, { lastActiveAt: null, createdAt: { $lt: d30 } }],
    }),
    User.countDocuments({
      banned: false,
      $or: [{ lastActiveAt: { $lt: d60 } }, { lastActiveAt: null, createdAt: { $lt: d60 } }],
    }),
    User.countDocuments({
      banned: false,
      $or: [{ lastActiveAt: { $lt: d90 } }, { lastActiveAt: null, createdAt: { $lt: d90 } }],
    }),
    User.countDocuments({ banned: false }),
  ]);

  res.status(200).json({
    inactive30,
    inactive60,
    inactive90,
    totalUsers,
    dormancyRate: totalUsers > 0 ? Number(((inactive60 / totalUsers) * 100).toFixed(1)) : 0,
  });
};

// @desc    Send bulk re-engagement reminder to inactive users
// @route   POST /api/admin/users/inactive/remind
// @access  Private/Admin
export const remindInactiveUsers = async (req, res) => {
  const { days = 60, title, message } = req.body;
  const threshold = new Date(Date.now() - (parseInt(days, 10) || 60) * 24 * 60 * 60 * 1000);

  const inactiveUsers = await User.find({
    banned: false,
    $or: [{ lastActiveAt: { $lt: threshold } }, { lastActiveAt: null, createdAt: { $lt: threshold } }],
  })
    .select("_id username")
    .limit(500)
    .lean();

  const io = req.app.get("io");
  const notifTitle = title || "We miss you on Soulmate!";
  const notifBody = message || "Someone might be looking for you. Come back to discover new matches today!";

  inactiveUsers.forEach((u) => {
    io?.to(u._id.toString()).emit("newNotification", {
      type: "re_engagement",
      title: notifTitle,
      message: notifBody,
      createdAt: new Date(),
    });
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "REMIND_INACTIVE_USERS",
    targetType: "User",
    details: { count: inactiveUsers.length, days, notifTitle },
    req,
  });

  res.status(200).json({
    message: `Re-engagement notification dispatched to ${inactiveUsers.length} inactive user(s).`,
    recipientCount: inactiveUsers.length,
  });
};
