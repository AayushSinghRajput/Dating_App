import AuditLog from "../models/auditLogModel.js";

// @desc    List system audit logs
// @route   GET /api/admin/audit-logs?action=&page=
// @access  Private/Admin
export const listAuditLogs = async (req, res) => {
  const { action, search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 30;

  const filter = {};
  if (action) filter.action = action;

  if (search.trim()) {
    const matchingAdmins = await import("../models/userModel.js").then((m) =>
      m.default
        .find({
          $or: [
            { username: { $regex: search.trim(), $options: "i" } },
            { email: { $regex: search.trim(), $options: "i" } },
          ],
        })
        .select("_id")
    );
    const adminIds = matchingAdmins.map((u) => u._id);

    filter.$or = [
      { action: { $regex: search.trim(), $options: "i" } },
      { targetType: { $regex: search.trim(), $options: "i" } },
      { admin: { $in: adminIds } },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("admin", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    logs,
    total,
    page: pageNum,
    pageSize,
  });
};
