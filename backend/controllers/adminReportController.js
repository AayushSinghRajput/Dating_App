import Report from "../models/reportModel.js";
import User from "../models/userModel.js";
import { notifyBannedUser } from "../utils/notify.js";

// @desc    List reports, newest first
// @route   GET /api/admin/reports?status=open
// @access  Private/Admin
export const listReports = async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const reports = await Report.find(filter)
    .populate("reporter", "username email")
    .populate("reportedUser", "username email banned")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.status(200).json({ reports });
};

// @desc    Act on a report: dismiss it, or ban the reported user
// @route   POST /api/admin/reports/:reportId/resolve
// @access  Private/Admin
export const resolveReport = async (req, res) => {
  const { reportId } = req.params;
  const { action, reason } = req.body; // "dismiss" | "ban"

  if (!["dismiss", "ban"].includes(action)) {
    return res.status(400).json({ message: "action must be 'dismiss' or 'ban'" });
  }

  const report = await Report.findById(reportId);
  if (!report) return res.status(404).json({ message: "Report not found" });

  if (action === "ban") {
    const banReason = reason || `Reported for: ${report.reason}`;
    await User.findByIdAndUpdate(report.reportedUser, {
      banned: true,
      bannedAt: new Date(),
      banReason,
    });
    notifyBannedUser(req.app.get("io"), report.reportedUser, banReason);
    report.status = "actioned";
  } else {
    report.status = "dismissed";
  }

  await report.save();

  res.status(200).json({ message: "Report resolved", report });
};
