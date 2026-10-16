"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Crown,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Plus,
  Ban,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function isExpired(d: string | null) {
  if (!d) return true;
  return new Date(d) < new Date();
}

function StatusBadge({ isPremium, expiresAt }: { isPremium: boolean; expiresAt: string | null }) {
  if (!isPremium || isExpired(expiresAt)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        Free
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/30 text-amber-400 text-xs font-medium border border-amber-700/40">
      <Crown className="w-3 h-3" />
      Premium
    </span>
  );
}

function ExtendModal({
  user,
  onClose,
  onExtend,
}: {
  user: any;
  onClose: () => void;
  onExtend: (days: number) => void;
}) {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [currentTime] = useState(() => Date.now());

  const handleExtend = async () => {
    setLoading(true);
    try {
      await onExtend(days);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-semibold text-white mb-1">Extend Subscription</h3>
        <p className="text-sm text-slate-400 mb-5">
          Extend premium for <span className="text-white font-medium">{user.profile?.name || user.username}</span>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Days to add</label>
            <div className="flex gap-2">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    days === d
                      ? "bg-violet-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              min={1}
            />
          </div>
          <div className="text-xs text-slate-500">
            New expiry:{" "}
            {user.isPremium && user.premiumExpiresAt && !isExpired(user.premiumExpiresAt)
              ? formatDate(new Date(new Date(user.premiumExpiresAt).getTime() + days * 86400000).toISOString())
              : formatDate(new Date(currentTime + days * 86400000).toISOString())}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExtend}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Extending…" : "Extend"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extendUser, setExtendUser] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const PAGE_SIZE = 25;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSubscriptions(status, search, page);
      setSubscriptions(res.subscriptions || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoke = async (userId: string) => {
    if (!confirm("Revoke premium access for this user?")) return;
    setActionLoading(userId);
    try {
      await adminApi.updateSubscription(userId, "revoke");
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to revoke");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async (days: number) => {
    if (!extendUser) return;
    setActionLoading(extendUser._id);
    try {
      await adminApi.updateSubscription(extendUser._id, "extend", days);
      setExtendUser(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to extend");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {extendUser && (
        <ExtendModal user={extendUser} onClose={() => setExtendUser(null)} onExtend={handleExtend} />
      )}
      <Header
        title="Subscription Management"
        description="View, extend, and revoke user premium subscriptions"
      />
      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearch(inputSearch); setPage(1); }}
            className="flex-1 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2">
            {["all", "active", "expired"].map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  status === s
                    ? "bg-violet-600 text-white"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3.5">User</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-left px-5 py-3.5">Expires</th>
                  <th className="text-left px-5 py-3.5">Member Since</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-slate-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : subscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {u.profile?.profileImage ? (
                              <img
                                src={u.profile.profileImage}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                                {u.username?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-200">
                                {u.profile?.name || u.username}
                              </p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge isPremium={u.isPremium} expiresAt={u.premiumExpiresAt} />
                        </td>
                        <td className="px-5 py-4">
                          <div className={`text-sm ${isExpired(u.premiumExpiresAt) ? "text-slate-500" : "text-slate-200"}`}>
                            {formatDate(u.premiumExpiresAt)}
                          </div>
                          {u.isPremium && !isExpired(u.premiumExpiresAt) && (
                            <div className="text-xs text-emerald-400 mt-0.5">
                              {Math.ceil((new Date(u.premiumExpiresAt).getTime() - now) / 86400000)}d left
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setExtendUser(u)}
                              disabled={actionLoading === u._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-900/30 text-violet-400 hover:bg-violet-900/50 text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Extend
                            </button>
                            {u.isPremium && !isExpired(u.premiumExpiresAt) && (
                              <button
                                onClick={() => handleRevoke(u._id)}
                                disabled={actionLoading === u._id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/30 text-rose-400 hover:bg-rose-900/50 text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
