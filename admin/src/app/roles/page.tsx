"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  UserPlus,
  Trash2,
  CheckCircle,
  Crown,
  Eye,
  Headphones,
  ShieldAlert,
  RefreshCw,
  Search,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface AdminMember {
  _id: string;
  username: string;
  email: string;
  adminRole: "superadmin" | "moderator" | "analyst" | "support" | "none";
  isAdmin: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export default function AdminRolesPage() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState("support");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdmins();
      setAdmins(res.admins || []);
    } catch (err: any) {
      console.error("Failed to load admins:", err);
      setNotification({ type: "error", text: "Failed to load admin team list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.assignAdminRole(userId, newRole);
      setAdmins((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, adminRole: newRole as any } : a))
      );
      setNotification({ type: "success", text: "Role updated successfully." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update role." });
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier) return;

    setInviteLoading(true);
    try {
      const res = await adminApi.promoteToAdmin(inviteIdentifier, inviteRole);
      setNotification({ type: "success", text: res.message || "Admin member promoted successfully." });
      setShowInviteModal(false);
      setInviteIdentifier("");
      fetchAdmins();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to promote user." });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to revoke admin privileges for @${username}?`)) return;

    try {
      await adminApi.revokeAdmin(userId);
      setAdmins((prev) => prev.filter((a) => a._id !== userId));
      setNotification({ type: "success", text: `Admin access revoked for @${username}.` });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to revoke admin privileges." });
    }
  };

  const superAdmins = admins.filter((a) => a.adminRole === "superadmin").length;
  const moderators = admins.filter((a) => a.adminRole === "moderator").length;
  const supportMembers = admins.filter((a) => a.adminRole === "support").length;
  const analysts = admins.filter((a) => a.adminRole === "analyst").length;

  const filteredAdmins = admins.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.adminRole.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin":
        return {
          label: "Super Admin",
          color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          icon: <Crown className="w-3.5 h-3.5 text-rose-400" />,
        };
      case "moderator":
        return {
          label: "Safety Moderator",
          color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />,
        };
      case "analyst":
        return {
          label: "BI Analyst",
          color: "bg-sky-500/20 text-sky-300 border-sky-500/30",
          icon: <Eye className="w-3.5 h-3.5 text-sky-400" />,
        };
      case "support":
        return {
          label: "Customer Support",
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          icon: <Headphones className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: "Standard User",
          color: "bg-slate-800 text-slate-400 border-slate-700",
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Admin Roles & RBAC Team Management"
        description="Configure role-based access control (Super Admin, Moderator, Analyst, Support Agent) and assign granular permissions across the platform."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/60 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Super Admins
              </span>
              <Crown className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {superAdmins}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Full system root privileges</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Moderators
              </span>
              <ShieldAlert className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-2">
              {moderators}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Photo queues, bans, and chat review</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Support Agents
              </span>
              <Headphones className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {supportMembers}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Tickets, GDPR queries & unfreezes</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                BI Analysts
              </span>
              <Eye className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-2">
              {analysts}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Revenue, cohorts & algorithm health</p>
          </div>
        </div>

        {/* Filter and Action Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search admin team by username/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchAdmins}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Promote Admin Member</span>
            </button>
          </div>
        </div>

        {/* Admin Team Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Admin Account</th>
                  <th className="px-6 py-3.5 font-semibold">Assigned Role</th>
                  <th className="px-6 py-3.5 font-semibold">Change Role</th>
                  <th className="px-6 py-3.5 font-semibold">Granted Date</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Loading admin team registry...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No admin accounts found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => {
                    const badge = getRoleBadge(admin.adminRole);
                    return (
                      <tr key={admin._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-rose-400">
                              {admin.username[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <div className="font-bold text-white">@{admin.username}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{admin.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 w-fit ${badge.color}`}
                          >
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={admin.adminRole}
                            onChange={(e) => handleRoleChange(admin._id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                          >
                            <option value="superadmin">Super Admin (All Access)</option>
                            <option value="moderator">Moderator (Safety & Photos)</option>
                            <option value="analyst">Analyst (Metrics & BI)</option>
                            <option value="support">Support (Tickets & User Inquiries)</option>
                          </select>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevoke(admin._id, admin.username)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Revoke Admin Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Promote Admin Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserPlus className="w-4 h-4 text-rose-500" />
                  <span>Promote Dater to Admin Team</span>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePromote} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Username or Email
                  </label>
                  <input
                    type="text"
                    value={inviteIdentifier}
                    onChange={(e) => setInviteIdentifier(e.target.value)}
                    placeholder="e.g. sarah_moderator or staff@soulmate.app"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Initial RBAC Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="support">Customer Support Agent</option>
                    <option value="moderator">Content Safety Moderator</option>
                    <option value="analyst">Business Intelligence Analyst</option>
                    <option value="superadmin">Super Admin (Full Root Access)</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20"
                  >
                    {inviteLoading ? "Promoting..." : "Grant Admin Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
