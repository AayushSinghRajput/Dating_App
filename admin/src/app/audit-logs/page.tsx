"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Ban,
  CheckCircle2,
  XCircle,
  Radio,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  BAN_USER: { label: "User Banned", color: "bg-rose-500/15 text-rose-400 border-rose-500/30", icon: Ban },
  UNBAN_USER: { label: "Ban Lifted", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  DELETE_USER_PHOTO: { label: "Photo Removed", color: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: Trash2 },
  VERIFICATION_APPROVE: { label: "Verification Approved", color: "bg-sky-500/15 text-sky-400 border-sky-500/30", icon: CheckCircle2 },
  VERIFICATION_REJECT: { label: "Verification Rejected", color: "bg-slate-800 text-slate-400 border-slate-700", icon: XCircle },
  REPORT_ACTION_BAN: { label: "Report Action: Banned", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: Ban },
  REPORT_DISMISS: { label: "Report Dismissed", color: "bg-slate-800 text-slate-400 border-slate-700", icon: CheckCircle2 },
  SEND_BROADCAST: { label: "Push Broadcast", color: "bg-pink-500/15 text-pink-400 border-pink-500/30", icon: Radio },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs(actionFilter, search, page);
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Administrative Audit Trail"
        description="Immutable event log of all moderator and admin actions across Soulmate"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search admin, action or details..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-auto"
              >
                <option value="">All Action Types</option>
                <option value="BAN_USER">Banned User</option>
                <option value="UNBAN_USER">Unbanned User</option>
                <option value="DELETE_USER_PHOTO">Deleted Photo</option>
                <option value="VERIFICATION_APPROVE">Verification Approved</option>
                <option value="VERIFICATION_REJECT">Verification Rejected</option>
                <option value="REPORT_ACTION_BAN">Report Action (Ban)</option>
                <option value="REPORT_DISMISS">Report Dismissed</option>
                <option value="SEND_BROADCAST">Push Broadcast</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Total Logs: <span className="text-white font-bold">{total}</span>
            </span>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Moderator</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Target & Details</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                  <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No administrative actions logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const cfg = ACTION_CONFIG[log.action] || {
                      label: log.action,
                      color: "bg-slate-800 text-slate-300 border-slate-700",
                      icon: Shield,
                    };
                    const Icon = cfg.icon;
                    const d = log.details || {};

                    return (
                      <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {log.admin?.username || "Admin"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {log.admin?.email || "—"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 max-w-md">
                          <div className="text-slate-300 font-mono text-[11px]">
                            {d.username && <span className="font-bold text-white mr-2">@{d.username}</span>}
                            {d.reason && <span className="text-slate-400">&ldquo;{d.reason}&rdquo;</span>}
                            {d.title && <span className="text-rose-300 font-bold">&ldquo;{d.title}&rdquo;</span>}
                            {d.photoUrl && (
                              <span className="text-slate-500 text-[10px] truncate block">
                                {d.photoUrl}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Entity: {log.targetType} {log.targetId ? `(${log.targetId})` : ""}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                          {log.ip || "127.0.0.1"}
                        </td>

                        <td className="px-6 py-4 text-slate-400 text-right">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Page {page} of {Math.max(1, Math.ceil(total / 30))}
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
                disabled={page * 30 >= total}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
