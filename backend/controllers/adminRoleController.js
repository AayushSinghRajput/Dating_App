import User from "../models/userModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List all admin users and their RBAC roles
// @route   GET /api/admin/roles
// @access  Private/SuperAdmin
export const listAdmins = async (req, res) => {
  const admins = await User.find({
    $or: [{ isAdmin: true }, { adminRole: { $in: ["superadmin", "moderator", "analyst", "support"] } }],
  })
    .select("username email adminRole isAdmin createdAt lastActiveAt")
    .sort({ createdAt: -1 })
    .lean();

  const formatted = admins.map((a) => ({
    ...a,
    adminRole: a.adminRole && a.adminRole !== "none" ? a.adminRole : a.isAdmin ? "superadmin" : "none",
  }));

  res.status(200).json({ admins: formatted });
};

// @desc    Assign or update an admin's role
// @route   PATCH /api/admin/roles/:userId
// @access  Private/SuperAdmin
export const assignAdminRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body; // "superadmin" | "moderator" | "analyst" | "support" | "none"

  const validRoles = ["superadmin", "moderator", "analyst", "support", "none"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `Invalid role. Allowed: ${validRoles.join(", ")}` });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  const oldRole = user.adminRole || (user.isAdmin ? "superadmin" : "none");
  user.adminRole = role;
  user.isAdmin = role !== "none";
  await user.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_ADMIN_ROLE",
    targetId: userId,
    targetType: "User",
    details: { username: user.username, oldRole, newRole: role },
    req,
  });

  res.status(200).json({
    message: `Role for @${user.username} updated to ${role}.`,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      adminRole: user.adminRole,
      isAdmin: user.isAdmin,
    },
  });
};

// @desc    Promote an existing dater account to an admin team role
// @route   POST /api/admin/roles/promote
// @access  Private/SuperAdmin
export const promoteToAdmin = async (req, res) => {
  const { emailOrUsername, role = "support" } = req.body;

  if (!emailOrUsername) {
    return res.status(400).json({ message: "Email or username is required" });
  }

  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.trim().toLowerCase() },
      { username: emailOrUsername.trim() },
    ],
  });

  if (!user) {
    return res.status(404).json({ message: "No account found matching that email/username." });
  }

  user.isAdmin = true;
  user.adminRole = role;
  await user.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "PROMOTE_ADMIN",
    targetId: user._id,
    targetType: "User",
    details: { username: user.username, email: user.email, role },
    req,
  });

  res.status(200).json({
    message: `Account @${user.username} successfully promoted to ${role}.`,
    admin: {
      _id: user._id,
      username: user.username,
      email: user.email,
      adminRole: user.adminRole,
      isAdmin: user.isAdmin,
    },
  });
};

// @desc    Revoke admin access completely
// @route   DELETE /api/admin/roles/:userId
// @access  Private/SuperAdmin
export const revokeAdminAccess = async (req, res) => {
  const { userId } = req.params;

  if (req.user._id.toString() === userId) {
    return res.status(400).json({ message: "You cannot revoke your own admin access." });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isAdmin = false;
  user.adminRole = "none";
  await user.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "REVOKE_ADMIN",
    targetId: userId,
    targetType: "User",
    details: { username: user.username },
    req,
  });

  res.status(200).json({ message: `Admin privileges revoked for @${user.username}.` });
};
