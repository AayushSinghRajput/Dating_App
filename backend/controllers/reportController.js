import Report from "../models/reportModel.js";
import { performBlock } from "../utils/block.js";
import { logEvent } from "../services/recommendation/eventLogger.js";

const VALID_REASONS = ["inappropriate_content", "fake_profile", "harassment", "spam", "other"];

// @desc    Report a user, and automatically block them so the reporter
//          doesn't keep seeing/hearing from someone they just flagged.
// @route   POST /api/reports/:targetUserId
// @access  Private
export const reportUser = async (req, res) => {
  const reporterId = req.user.id;
  const { targetUserId } = req.params;
  const { reason, details } = req.body;

  if (reporterId === targetUserId) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  if (!reason || !VALID_REASONS.includes(reason)) {
    return res.status(400).json({ message: "A valid reason is required." });
  }

  const report = await Report.create({
    reporter: reporterId,
    reportedUser: targetUserId,
    reason,
    details,
  });

  try {
    await performBlock(reporterId, targetUserId);
  } catch (blockError) {
    console.error("Error auto-blocking after report:", blockError);
  }

  logEvent(reporterId, targetUserId, "REPORT", { reason });

  res.status(201).json({ message: "Report submitted", reportId: report._id });
};
