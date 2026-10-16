import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    Toggle user shadowban status (silent algorithmic suppression)
// @route   POST /api/admin/users/:userId/shadowban
// @access  Private/Admin
export const toggleShadowban = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isShadowbanned, reason = "" } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isShadowbanned = Boolean(isShadowbanned);
    user.shadowbanReason = reason;
    user.shadowbannedAt = isShadowbanned ? new Date() : null;

    // Automatically drop trust score if shadowbanned
    if (isShadowbanned && user.trustScore > 40) {
      user.trustScore = 30;
    } else if (!isShadowbanned && user.trustScore < 50) {
      user.trustScore = 75; // Reset to reasonable default
    }

    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      action: user.isShadowbanned ? "USER_SHADOWBAN" : "USER_UNSHADOWBAN",
      targetId: user._id,
      targetType: "User",
      details: {
        username: user.username,
        email: user.email,
        reason,
        trustScore: user.trustScore,
      },
      req,
    });

    res.status(200).json({
      message: user.isShadowbanned
        ? `User @${user.username} is now shadowbanned. Their profile will be excluded from all candidate feeds.`
        : `User @${user.username} shadowban lifted.`,
      user: {
        _id: user._id,
        username: user.username,
        isShadowbanned: user.isShadowbanned,
        shadowbanReason: user.shadowbanReason,
        shadowbannedAt: user.shadowbannedAt,
        trustScore: user.trustScore,
      },
    });
  } catch (error) {
    console.error("Error toggling shadowban:", error);
    res.status(500).json({ message: "Server error toggling shadowban" });
  }
};

// @desc    Update user trust score (0 - 100)
// @route   POST /api/admin/users/:userId/trust-score
// @access  Private/Admin
export const updateTrustScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { trustScore, reason = "" } = req.body;

    const scoreNum = Number(trustScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return res.status(400).json({ message: "Trust score must be a number between 0 and 100" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldScore = user.trustScore;
    user.trustScore = scoreNum;

    // Auto-shadowban if trust score hits critical low (<25)
    if (scoreNum < 25 && !user.isShadowbanned) {
      user.isShadowbanned = true;
      user.shadowbanReason = reason || "Auto-shadowbanned: Trust score fell below 25";
      user.shadowbannedAt = new Date();
    }

    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      action: "TRUST_SCORE_UPDATE",
      targetId: user._id,
      targetType: "User",
      details: {
        username: user.username,
        oldScore,
        newScore: scoreNum,
        reason,
        autoShadowbanned: scoreNum < 25,
      },
      req,
    });

    res.status(200).json({
      message: `Trust score updated to ${scoreNum}/100`,
      trustScore: user.trustScore,
      isShadowbanned: user.isShadowbanned,
    });
  } catch (error) {
    console.error("Error updating trust score:", error);
    res.status(500).json({ message: "Server error updating trust score" });
  }
};

// @desc    List shadowbanned and low-trust users
// @route   GET /api/admin/shadowbanned
// @access  Private/Admin
export const listShadowbannedUsers = async (req, res) => {
  try {
    const { page = "1", limit = "20", search = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);

    const query = {
      $or: [
        { isShadowbanned: true },
        { trustScore: { $lt: 50 } },
      ],
    };

    if (search.trim()) {
      query.$and = [
        {
          $or: [
            { username: { $regex: search.trim(), $options: "i" } },
            { email: { $regex: search.trim(), $options: "i" } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("username email trustScore isShadowbanned shadowbanReason shadowbannedAt banned frozen createdAt lastActiveAt")
        .sort({ isShadowbanned: -1, trustScore: 1, updatedAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(query),
    ]);

    const userIds = users.map((u) => u._id);
    const profiles = await Profile.find({ user: { $in: userIds } })
      .select("user name profileImage photos age gender location verified")
      .lean();

    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.user.toString()] = p;
    });

    const enriched = users.map((u) => ({
      ...u,
      profile: profileMap[u._id.toString()] || null,
    }));

    res.status(200).json({
      users: enriched,
      total,
      page: pageNum,
      pageSize,
    });
  } catch (error) {
    console.error("Error listing shadowbanned users:", error);
    res.status(500).json({ message: "Server error listing shadowbanned users" });
  }
};
