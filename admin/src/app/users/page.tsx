"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  ShieldAlert,
  Ban,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Snowflake,
  BadgeCheck,
  Download,
  BellRing,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection & Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionModal, setBulkActionModal] = useState<{
    action: "ban" | "freeze" | null;
  }>({ action: null });
  const [bulkReason, setBulkReason] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Inactive stats & Re-engagement modal
  const [inactiveStats, setInactiveStats] = useState<any>(null);
  const [remindModalOpen, setRemindModalOpen] = useState(false);
  const [remindTitle, setRemindTitle] = useState("");
  const [remindBody, setRemindBody] = useState("");
  const [remindDays, setRemindDays] = useState(60);
  const [remindLoading, setRemindLoading] = useState(false);

  // Single-user modals
  const [banModalUser, setBanModalUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(search, page, statusFilter);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [search, page, statusFilter]);

  const fetchInactiveStats = async () => {
    try {
      const stats = await adminApi.getInactiveUsersStats();
      setInactiveStats(stats);
    } catch (err) {
      console.error("Failed to fetch inactive stats:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchInactiveStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Selection helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.map((u) => u._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Execute bulk action
  const executeBulkAction = async (action: string, reason?: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await adminApi.bulkUserAction(selectedIds, action, reason);
      alert(res.message || `Bulk ${action} succeeded`);
      setSelectedIds([]);
      setBulkActionModal({ action: null });
      setBulkReason("");
      fetchUsers();
      fetchInactiveStats();
    } catch (err: any) {
      alert(err?.message || `Failed to execute bulk ${action}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0
      ? users.filter((u) => selectedIds.includes(u._id))
      : users;

    if (listToExport.length === 0) {
      alert("No users to export");
      return;
    }

    const headers = ["User ID", "Username", "Email", "Status", "Tier", "Verified", "Registered", "Last Active"];
    const rows = listToExport.map((u) => [
      u._id,
      u.username,
      u.email,
      u.banned ? "Banned" : u.frozen ? "Frozen" : "Active",
      u.isPremium ? "Premium" : "Free",
      u.profile?.verified ? "Yes" : "No",
      new Date(u.createdAt).toISOString(),
      u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : "Never",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((f) => `"${f}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Single user actions
  const handleBan = async () => {
    if (!banModalUser) return;
    setActionLoading(true);
    try {
      await adminApi.banUser(banModalUser._id, banReason);
      setBanModalUser(null);
      setBanReason("");
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm("Are you sure you want to lift the ban for this user?")) return;
    try {
      await adminApi.unbanUser(userId);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to unban user");
    }
  };

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setRemindLoading(true);
    try {
      const res = await adminApi.remindInactiveUsers(remindDays, remindTitle, remindBody);
      alert(res.message || "Re-engagement notifications dispatched!");
      setRemindModalOpen(false);
      setRemindTitle("");
      setRemindBody("");
    } catch (err: any) {
      alert(err?.message || "Failed to send reminders");
    } finally {
      setRemindLoading(false);
    }
  };

  const [currentTime] = useState(() => Date.now());

  const isDormant = (lastActiveAt?: string, createdAt?: string) => {
    const sixtyDaysAgo = currentTime - 60 * 24 * 60 * 60 * 1000;
    if (lastActiveAt) {
      return new Date(lastActiveAt).getTime() < sixtyDaysAgo;
    }
    return createdAt ? new Date(createdAt).getTime() < sixtyDaysAgo : false;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen relative">
      <Header
        title="Users Directory & Account Moderation"
        description="Search accounts, run bulk actions, manage verified badges, monitor dormant accounts, or freeze offending users"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto pb-24">
        {/* Inactive & Dormancy Intelligence Card */}
        {inactiveStats && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dormancy & Retention Telemetry
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                    {inactiveStats.dormancyRate}% Dormant Rate
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>30d+ Inactive: <strong className="text-white">{inactiveStats.inactive30}</strong></span>
                  <span>·</span>
                  <span>60d+ Dormant: <strong className="text-amber-400">{inactiveStats.inactive60}</strong></span>
                  <span>·</span>
                  <span>90d+ Abandoned: <strong className="text-rose-400">{inactiveStats.inactive90}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setRemindTitle("We miss you on Soulmate!");
                setRemindBody("Someone new in your area just liked profiles like yours. Come back to see your matches!");
                setRemindModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap self-stretch md:self-auto justify-center"
            >
              <BellRing className="w-4 h-4" />
              <span>Dispatch Re-engagement Reminder</span>
            </button>
          </div>
        )}

        {/* Controls, Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username, email or ID..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "banned", label: "Banned" },
                { id: "frozen", label: "Frozen" },
                { id: "premium", label: "Premium" },
                { id: "admin", label: "Admins" },
                { id: "inactive", label: "Inactive (60d+)" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    statusFilter === tab.id
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
              title="Export visible or selected records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <div className="text-xs text-slate-400 whitespace-nowrap">
              Total Accounts: <span className="text-white font-bold">{total}</span>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">User Profile</th>
                  <th className="px-6 py-4 font-semibold">Tier & Badges</th>
                  <th className="px-6 py-4 font-semibold">Account Status</th>
                  <th className="px-6 py-4 font-semibold">Activity</th>
                  <th className="px-6 py-4 font-semibold">Registered</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                        <span>Loading user accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No user accounts found matching your query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedIds.includes(u._id);
                    const dormant = isDormant(u.lastActiveAt, u.createdAt);
                    const isVerified = Boolean(u.profile?.verified);

                    return (
                      <tr
                        key={u._id}
                        className={`transition-colors ${
                          isSelected ? "bg-rose-950/20" : "hover:bg-slate-800/30"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(u._id)}
                            className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <Link href={`/users/${u._id}`} className="flex items-center gap-3 group">
                            {u.profile?.profileImage || u.profile?.photos?.[0] ? (
                              <img
                                src={u.profile.profileImage || u.profile.photos[0]}
                                alt=""
                                className="w-9 h-9 rounded-xl object-cover bg-slate-950 border border-slate-700"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-rose-400 group-hover:border-rose-500 transition-colors">
                                {u.username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                                <span>{u.profile?.name || u.username}</span>
                                {isVerified && (
                                  <span title="Verified Account">
                                    <BadgeCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                @{u.username} · {u.email}
                              </div>
                            </div>
                          </Link>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {u.isAdmin && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold text-[10px]">
                                Admin
                              </span>
                            )}
                            {u.isPremium ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold text-[10px] flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Premium
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                Free
                              </span>
                            )}
                            {isVerified && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold text-[10px] flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            {u.banned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-800/60 text-rose-400 font-semibold text-[11px]">
                                <Ban className="w-3 h-3" />
                                Banned
                              </span>
                            ) : u.frozen ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-950/40 border border-sky-800/60 text-sky-400 font-semibold text-[11px]">
                                <Snowflake className="w-3 h-3" />
                                Frozen
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-slate-300">
                            {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "Never"}
                          </div>
                          {dormant && (
                            <span className="text-[10px] text-amber-400 font-medium block">
                              Dormant (60d+)
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/users/${u._id}`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Inspect Full Profile, Matches & Chats"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {u.banned ? (
                              <button
                                onClick={() => handleUnban(u._id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors text-[11px] font-medium"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanModalUser(u)}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors text-[11px] font-medium"
                              >
                                Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Page {page} of {Math.max(1, Math.ceil(total / 25))}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 25 >= total}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-xs animate-slide-up">
            <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px]">
                {selectedIds.length}
              </span>
              <span className="text-white font-semibold">Selected</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setBulkActionModal({ action: "ban" })}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Bulk Ban</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Lift ban for ${selectedIds.length} account(s)?`)) {
                    executeBulkAction("unban");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Bulk Unban</span>
              </button>

              <button
                onClick={() => setBulkActionModal({ action: "freeze" })}
                className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-semibold transition-colors flex items-center gap-1"
              >
                <Snowflake className="w-3.5 h-3.5" />
                <span>Bulk Freeze</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Unfreeze ${selectedIds.length} account(s)?`)) {
                    executeBulkAction("unfreeze");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
              >
                Bulk Unfreeze
              </button>

              <button
                onClick={() => {
                  if (confirm(`Grant Verified blue badges to ${selectedIds.length} user(s)?`)) {
                    executeBulkAction("verify");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold transition-colors flex items-center gap-1"
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Grant Badge</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Revoke Verified badges from ${selectedIds.length} user(s)?`)) {
                    executeBulkAction("unverify");
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Revoke Badge
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-lg text-slate-400 hover:text-white border-l border-slate-800 pl-3 ml-2"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bulk Action Reason Modal (Ban / Freeze) */}
        {bulkActionModal.action && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    bulkActionModal.action === "ban"
                      ? "bg-rose-500/10 text-rose-400"
                      : "bg-sky-500/10 text-sky-400"
                  }`}
                >
                  {bulkActionModal.action === "ban" ? (
                    <Ban className="w-5 h-5" />
                  ) : (
                    <Snowflake className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white capitalize">
                    Bulk {bulkActionModal.action} ({selectedIds.length} Users)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide an administrative audit reason for this bulk operation.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Bulk {bulkActionModal.action}
                </label>
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder={`e.g. Mass spam attack, bot wave, security suspension...`}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setBulkActionModal({ action: null })}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeBulkAction(bulkActionModal.action!, bulkReason)}
                  disabled={bulkLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg ${
                    bulkActionModal.action === "ban"
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                      : "bg-sky-600 hover:bg-sky-500 shadow-sky-600/20"
                  }`}
                >
                  {bulkLoading ? "Applying..." : `Confirm Bulk ${bulkActionModal.action}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Re-engagement Reminder Modal */}
        {remindModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleSendReminder}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-sky-400">
                <BellRing className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Send Inactive User Reminder
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatches push notification & socket alert to inactive accounts
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Inactivity Threshold
                  </label>
                  <select
                    value={remindDays}
                    onChange={(e) => setRemindDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value={30}>30+ Days Inactive ({inactiveStats?.inactive30 || 0} users)</option>
                    <option value={60}>60+ Days Inactive ({inactiveStats?.inactive60 || 0} users)</option>
                    <option value={90}>90+ Days Abandoned ({inactiveStats?.inactive90 || 0} users)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Notification Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={remindTitle}
                    onChange={(e) => setRemindTitle(e.target.value)}
                    placeholder="We miss you on Soulmate!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">
                    Message Body
                  </label>
                  <textarea
                    required
                    value={remindBody}
                    onChange={(e) => setRemindBody(e.target.value)}
                    placeholder="New matches are waiting..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRemindModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={remindLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-lg shadow-sky-600/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {remindLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Reminders</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Single User Ban Modal */}
        {banModalUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-base font-bold text-white">
                  Ban @{banModalUser.username}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                This will immediately revoke all active sessions and block further access to Soulmate.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Ban
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Terms of Service violation, harassment, fake account..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20"
                >
                  {actionLoading ? "Banning..." : "Confirm Account Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
