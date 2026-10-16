import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { notifyBannedUser } from "../utils/notify.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Detect and rank suspicious accounts and potential bots
// @route   GET /api/admin/bots?minScore=&page=
// @access  Private/Admin
export const getSuspiciousUsers = async (req, res) => {
  const { minScore = "30" } = req.query;
  const threshold = parseInt(minScore, 10) || 30;

  const users = await User.find({ banned: false })
    .select("username email createdAt lastActiveAt frozen isPremium")
    .lean();

  const userIds = users.map((u) => u._id);
  const profiles = await Profile.find({ user: { $in: userIds } }).lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const suspiciousList = [];

  for (const user of users) {
    const profile = profileMap[user._id.toString()];
    if (!profile) continue;

    let riskScore = 0;
    const riskFlags = [];

    const rightSwipes = (profile.likes?.length || 0) + (profile.superLikes?.length || 0);
    const leftSwipes = profile.passes?.length || 0;
    const totalSwipes = rightSwipes + leftSwipes;

    // 1. Extreme right-swipe ratio (>95% likes with sufficient volume)
    if (totalSwipes >= 30 && rightSwipes / totalSwipes >= 0.95) {
      riskScore += 35;
      riskFlags.push("Automated Right Swiper (>95% like rate)");
    } else if (totalSwipes >= 50 && rightSwipes / totalSwipes >= 0.9) {
      riskScore += 20;
      riskFlags.push("High like-to-pass ratio (>90%)");
    }

    // 2. Suspicious external link or handle in bio (Telegram, WhatsApp, OnlyFans, t.me)
    const bio = (profile.aboutMe || "").toLowerCase();
    const spamPatterns = [
      "t.me",
      "telegram",
      "whatsapp",
      "wa.me",
      "onlyfans",
      "cashapp",
      "paypal.me",
      "+977",
      "call me",
      "dm on ig",
      "snap:",
      "crypto",
      "forex",
      "investment",
    ];
    const detectedPatterns = spamPatterns.filter((pat) => bio.includes(pat));
    if (detectedPatterns.length > 0) {
      riskScore += 40;
      riskFlags.push(`Commercial/External handles in bio (${detectedPatterns.join(", ")})`);
    }

    // 3. New account with very high swipe velocity
    const hoursOld = Math.max(1, (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60));
    const swipesPerHour = totalSwipes / hoursOld;
    if (hoursOld < 48 && swipesPerHour > 15) {
      riskScore += 30;
      riskFlags.push(`Abnormal Swipe Velocity (${Math.round(swipesPerHour)} swipes/hr)`);
    }

    // 4. Incomplete/Faceless profile active swiping
    const photoCount = profile.photos?.length || 0;
    if (photoCount === 0 && totalSwipes > 20) {
      riskScore += 25;
      riskFlags.push("Active Swiper with 0 photos uploaded");
    }

    // 5. Unverified + zero bio + high volume
    if (!profile.verified && !profile.aboutMe && totalSwipes > 40) {
      riskScore += 15;
      riskFlags.push("Unverified anonymous profile with heavy activity");
    }

    if (riskScore >= threshold) {
      suspiciousList.push({
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          frozen: user.frozen,
        },
        profile: {
          name: profile.name,
          profileImage: profile.profileImage || profile.photos?.[0] || "",
          aboutMe: profile.aboutMe,
          verified: profile.verified,
        },
        riskScore: Math.min(100, riskScore),
        riskLevel: riskScore >= 70 ? "critical" : riskScore >= 45 ? "high" : "medium",
        riskFlags,
        stats: {
          totalSwipes,
          rightSwipes,
          leftSwipes,
          matches: profile.matches?.length || 0,
        },
      });
    }
  }

  suspiciousList.sort((a, b) => b.riskScore - a.riskScore);

  res.status(200).json({
    totalDetected: suspiciousList.length,
    criticalCount: suspiciousList.filter((s) => s.riskLevel === "critical").length,
    highRiskCount: suspiciousList.filter((s) => s.riskLevel === "high").length,
    bots: suspiciousList.slice(0, 50),
  });
};

// @desc    Take moderation action against a detected bot / fake account
// @route   POST /api/admin/bots/:userId/action
// @access  Private/Admin
export const takeBotAction = async (req, res) => {
  const { userId } = req.params;
  const { action, reason } = req.body; // action: "ban" | "freeze" | "clear_bio" | "dismiss"

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  let resultMsg = "";

  switch (action) {
    case "ban":
      user.banned = true;
      user.bannedAt = new Date();
      user.banReason = reason || "Automated Bot / Fraudulent profile detection";
      await user.save();
      notifyBannedUser(req.app.get("io"), userId, user.banReason);
      resultMsg = `User @${user.username} has been permanently banned.`;
      break;

    case "freeze":
      user.frozen = true;
      user.frozenAt = new Date();
      user.frozenReason = reason || "Flagged by bot detection system for review";
      await user.save();
      resultMsg = `User @${user.username} has been temporarily frozen.`;
      break;

    case "clear_bio":
      await Profile.findOneAndUpdate(
        { user: userId },
        { aboutMe: "[Bio removed by moderation for violating safety rules]" }
      );
      resultMsg = `Commercial / spam bio cleared for user @${user.username}.`;
      break;

    case "dismiss":
      resultMsg = `Flag dismissed for user @${user.username}.`;
      break;

    default:
      return res.status(400).json({ message: "Invalid action. Supported: ban, freeze, clear_bio, dismiss" });
  }

  await logAdminAction({
    adminId: req.user._id,
    action: `BOT_MODERATION_${action.toUpperCase()}`,
    targetId: userId,
    targetType: "User",
    details: { username: user.username, action, reason },
    req,
  });

  res.status(200).json({ message: resultMsg, action });
};
