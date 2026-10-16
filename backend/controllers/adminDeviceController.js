import DeviceBlacklist from "../models/deviceBlacklistModel.js";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List all banned devices, hardware fingerprints, and IPs
// @route   GET /api/admin/devices
// @access  Private/Admin
export const listBannedDevices = async (req, res) => {
  try {
    const { page = "1", limit = "20", search = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);

    const query = {};
    if (search.trim()) {
      query.$or = [
        { deviceId: { $regex: search.trim(), $options: "i" } },
        { hardwareFingerprint: { $regex: search.trim(), $options: "i" } },
        { ipAddress: { $regex: search.trim(), $options: "i" } },
        { reason: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [devices, total] = await Promise.all([
      DeviceBlacklist.find(query)
        .populate("bannedBy", "username email")
        .populate("associatedAccounts", "username email banned isPremium")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      DeviceBlacklist.countDocuments(query),
    ]);

    res.status(200).json({
      devices,
      total,
      page: pageNum,
      pageSize,
    });
  } catch (error) {
    console.error("Error listing banned devices:", error);
    res.status(500).json({ message: "Server error listing banned devices" });
  }
};

// @desc    Ban a device / hardware fingerprint / IP and optionally auto-ban linked accounts
// @route   POST /api/admin/devices/ban
// @access  Private/Admin
export const banDevice = async (req, res) => {
  try {
    const {
      deviceId,
      hardwareFingerprint,
      ipAddress,
      reason,
      autoBanAccounts = true,
      targetUserId,
    } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "A reason is required to ban a device" });
    }

    if (!deviceId && !hardwareFingerprint && !ipAddress && !targetUserId) {
      return res.status(400).json({
        message: "Must provide a deviceId, hardwareFingerprint, ipAddress, or targetUserId",
      });
    }

    let finalDeviceId = deviceId;
    let finalFingerprint = hardwareFingerprint;
    let finalIp = ipAddress;

    // If targetUserId is passed, resolve their device credentials
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        if (!finalDeviceId && targetUser.deviceId) finalDeviceId = targetUser.deviceId;
        if (!finalFingerprint && targetUser.hardwareFingerprint) finalFingerprint = targetUser.hardwareFingerprint;
        if (!finalIp && targetUser.lastIp) finalIp = targetUser.lastIp;
      }
    }

    // Find all users linked to any of these hardware identifiers
    const userMatchConditions = [];
    if (finalDeviceId) userMatchConditions.push({ deviceId: finalDeviceId });
    if (finalFingerprint) userMatchConditions.push({ hardwareFingerprint: finalFingerprint });
    if (finalIp) userMatchConditions.push({ lastIp: finalIp });
    if (targetUserId) userMatchConditions.push({ _id: targetUserId });

    let associatedUserIds = [];
    if (userMatchConditions.length > 0) {
      const linkedUsers = await User.find({ $or: userMatchConditions }).select("_id username");
      associatedUserIds = linkedUsers.map((u) => u._id);

      // Auto-ban linked accounts if requested
      if (autoBanAccounts && associatedUserIds.length > 0) {
        await User.updateMany(
          { _id: { $in: associatedUserIds } },
          {
            $set: {
              banned: true,
              bannedAt: new Date(),
              banReason: `Hardware Device Banned: ${reason}`,
            },
          }
        );
      }
    }

    const newRecord = await DeviceBlacklist.create({
      deviceId: finalDeviceId || undefined,
      hardwareFingerprint: finalFingerprint || undefined,
      ipAddress: finalIp || undefined,
      reason: reason.trim(),
      bannedBy: req.user._id,
      associatedAccounts: associatedUserIds,
    });

    await logAdminAction({
      adminId: req.user._id,
      action: "DEVICE_HARDWARE_BAN",
      targetId: newRecord._id,
      targetType: "DeviceBlacklist",
      details: {
        deviceId: finalDeviceId,
        hardwareFingerprint: finalFingerprint,
        ipAddress: finalIp,
        reason,
        linkedAccountsCount: associatedUserIds.length,
        autoBannedAccounts: autoBanAccounts,
      },
      req,
    });

    res.status(201).json({
      message: `Device blacklisted successfully. ${associatedUserIds.length} linked account(s) affected.`,
      device: newRecord,
      linkedAccountsCount: associatedUserIds.length,
    });
  } catch (error) {
    console.error("Error banning device:", error);
    res.status(500).json({ message: "Server error banning device" });
  }
};

// @desc    Unban a blacklisted device
// @route   DELETE /api/admin/devices/:id
// @access  Private/Admin
export const unbanDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await DeviceBlacklist.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({ message: "Device blacklist record not found" });
    }

    await logAdminAction({
      adminId: req.user._id,
      action: "DEVICE_HARDWARE_UNBAN",
      targetId: id,
      targetType: "DeviceBlacklist",
      details: {
        deviceId: record.deviceId,
        hardwareFingerprint: record.hardwareFingerprint,
        ipAddress: record.ipAddress,
      },
      req,
    });

    res.status(200).json({ message: "Device blacklist entry removed successfully" });
  } catch (error) {
    console.error("Error unbanning device:", error);
    res.status(500).json({ message: "Server error unbanning device" });
  }
};

// @desc    Detect multi-account device clusters (bot farms / catfish rings)
// @route   GET /api/admin/devices/clusters
// @access  Private/Admin
export const getDeviceClusters = async (req, res) => {
  try {
    // 1. Group by deviceId where count >= 2
    const deviceClusters = await User.aggregate([
      {
        $match: {
          deviceId: { $exists: true, $ne: null, $nin: ["", "unknown", "emulator"] },
        },
      },
      {
        $group: {
          _id: "$deviceId",
          count: { $sum: 1 },
          userIds: { $push: "$_id" },
          usernames: { $push: "$username" },
          emails: { $push: "$email" },
          bannedCount: {
            $sum: { $cond: [{ $eq: ["$banned", true] }, 1, 0] },
          },
          avgTrustScore: { $avg: "$trustScore" },
          latestActive: { $max: "$lastActiveAt" },
        },
      },
      {
        $match: {
          count: { $gte: 2 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 25,
      },
    ]);

    // Populate user profile info for top accounts in each cluster
    const enrichedClusters = await Promise.all(
      deviceClusters.map(async (c) => {
        const users = await User.find({ _id: { $in: c.userIds } })
          .select("username email banned isPremium trustScore createdAt lastActiveAt")
          .limit(6)
          .lean();

        const profiles = await Profile.find({ user: { $in: c.userIds } })
          .select("user name profileImage photos age gender location")
          .limit(6)
          .lean();

        const profileMap = {};
        profiles.forEach((p) => {
          profileMap[p.user.toString()] = p;
        });

        const usersWithProfile = users.map((u) => ({
          ...u,
          profile: profileMap[u._id.toString()] || null,
        }));

        // Check if device is already in blacklist
        const isBlacklisted = await DeviceBlacklist.exists({ deviceId: c._id });

        return {
          clusterKey: c._id,
          type: "deviceId",
          accountCount: c.count,
          bannedCount: c.bannedCount,
          avgTrustScore: Math.round(c.avgTrustScore || 100),
          latestActive: c.latestActive,
          isBlacklisted: Boolean(isBlacklisted),
          accounts: usersWithProfile,
        };
      })
    );

    res.status(200).json({
      clusters: enrichedClusters,
      totalClusters: enrichedClusters.length,
    });
  } catch (error) {
    console.error("Error detecting device clusters:", error);
    res.status(500).json({ message: "Server error detecting device clusters" });
  }
};
