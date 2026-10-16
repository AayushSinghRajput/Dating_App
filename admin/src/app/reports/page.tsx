"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Ban,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open"); // "open" | "actioned" | "dismissed" | "all"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReports(filter, search, page);
      setReports(res.reports || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleResolve = async (
    reportId: string,
    action: "dismiss" | "ban",
    username?: string
  ) => {
    const confirmPrompt =
      action === "ban"
        ? `Are you sure you want to permanently BAN @${username || "user"} based on this report?`
        : "Dismiss this report as resolved / unfounded?";
    if (!confirm(confirmPrompt)) return;

    setActionLoading(reportId);
    try {
      await adminApi.resolveReport(reportId, action);
      fetchReports();
    } catch (err: any) {
      alert(err?.message || "Failed to resolve report");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Reports & Community Safety"
        description="Review reports filed by daters regarding harassment, fake profiles, or safety violations"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Controls, Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reason or user..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
              {[
                { id: "open", label: "Open Flags" },
                { id: "actioned", label: "Actioned" },
                { id: "dismissed", label: "Dismissed" },
                { id: "all", label: "All Reports" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filter === tab.id
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
            <span className="text-xs text-slate-400">
              Total Reports: <span className="text-white font-bold">{total}</span>
            </span>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Reports Table / Feed */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-24 text-center text-slate-500 text-sm">
              Loading safety reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Reports in this View</h3>
              <p className="text-xs text-slate-500 mt-1">
                All community flags matching this filter have been addressed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {reports.map((r) => {
                const isWorking = actionLoading === r._id;
                const reporter = r.reporter || {};
                const reported = r.reportedUser || {};

                return (
                  <div
                    key={r._id}
                    className="p-6 hover:bg-slate-850/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            r.status === "open"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : r.status === "actioned"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {r.status}
                        </span>

                        <span className="text-xs text-slate-500">
                          Filed on {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Reported Party
                          </span>
                          <div className="text-sm font-bold text-white mt-0.5">
                            {reported.username || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-400">{reported.email}</div>
                          {reported.banned && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-rose-400">
                              (Already Banned)
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Reporter
                          </span>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">
                            {reporter.username || "Anonymous"}
                          </div>
                          <div className="text-xs text-slate-400">{reporter.email}</div>
                        </div>
                      </div>

                      <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 text-xs text-rose-200">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-rose-400 block mb-0.5">
                          Report Violation Reason:
                        </span>
                        {r.reason || "No explicit reason text provided."}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {r.status === "open" && (
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleResolve(r._id, "ban", reported.username)}
                          disabled={isWorking}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Ban User</span>
                        </button>

                        <button
                          onClick={() => handleResolve(r._id, "dismiss")}
                          disabled={isWorking}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Page {page} of {Math.max(1, Math.ceil(total / 20))}
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
                disabled={page * 20 >= total}
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
