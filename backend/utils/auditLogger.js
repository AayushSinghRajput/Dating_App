import AuditLog from "../models/auditLogModel.js";

export async function logAdminAction({
  adminId,
  action,
  targetId,
  targetType = "User",
  details = {},
  req,
}) {
  try {
    const ip =
      req?.headers["x-forwarded-for"]?.split(",")[0] ||
      req?.socket?.remoteAddress ||
      "";

    await AuditLog.create({
      admin: adminId,
      action,
      targetId: targetId ? targetId.toString() : undefined,
      targetType,
      details,
      ip,
    });
  } catch (err) {
    console.error("[AuditLogger] Failed to write audit log:", err);
  }
}
