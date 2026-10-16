import Report from "../models/reportModel.js";
import User from "../models/userModel.js";
import { notifyBannedUser } from "../utils/notify.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List reports, newest first with server-side pagination, search & status filter
// @route   GET /api/admin/reports?status=open&search=&page=
// @access  Private/Admin
export const listReports = async (req, res) => {
  const { status, search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  if (search.trim()) {
    const matchingUsers = await User.find({
      $or: [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { reason: { $regex: search.trim(), $options: "i" } },
      { reporter: { $in: userIds } },
      { reportedUser: { $in: userIds } },
    ];
  }

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("reporter", "username email")
      .populate("reportedUser", "username email banned")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Report.countDocuments(filter),
  ]);

  res.status(200).json({ reports, total, page: pageNum, pageSize });
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

  await logAdminAction({
    adminId: req.user._id,
    action: action === "ban" ? "REPORT_ACTION_BAN" : "REPORT_DISMISS",
    targetId: reportId,
    targetType: "Report",
    details: { reportedUser: report.reportedUser, action, reason },
    req,
  });

  res.status(200).json({ message: "Report resolved", report });
};
