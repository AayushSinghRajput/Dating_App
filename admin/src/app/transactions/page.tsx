"use client";

import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Search,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refundLoading, setRefundLoading] = useState<string | null>(null);

  const handleRefund = async (txId: string, currentRefundStatus: string) => {
    const next = currentRefundStatus === "none" || currentRefundStatus === "rejected" ? "requested" : "approved";
    const note = prompt(`Mark this transaction as "${next}"? Add an optional note:`);
    if (note === null) return;
    setRefundLoading(txId);
    try {
      await adminApi.updateRefund(txId, next, note || undefined);
      fetchTransactions();
    } catch (e: any) {
      alert(e?.message || "Failed to update refund");
    } finally {
      setRefundLoading(null);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getTransactions(provider, status, search, page);
      setTransactions(res.transactions || []);
      setStats(res.stats || null);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [provider, status, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Finances & Subscription Ledger"
        description="Audit in-app purchases, eSewa and Khalti payment gateways, and membership revenue"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Revenue KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Completed GMV */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Realized GMV
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                NPR
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-400">
              Rs. {(stats?.totalCompletedRevenue ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Successfully settled payments</p>
          </div>

          {/* Completed Volume */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Completed Subscriptions
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              {(stats?.completedCount ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active Premium conversions</p>
          </div>

          {/* Pending In-Flight */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending Gateway Volume
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-amber-400">
              Rs. {(stats?.totalPendingAmount ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting webhook callbacks</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction ID or user..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            {/* Provider Filter */}
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-auto"
            >
              <option value="">All Gateways</option>
              <option value="esewa">eSewa</option>
              <option value="khalti">Khalti</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-auto"
            >
              <option value="">All States</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Total Records: <span className="text-white font-bold">{total}</span>
            </span>

            <button
              onClick={fetchTransactions}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Provider</th>
                  <th className="px-6 py-4 font-semibold">Plan</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Refund</th>
                  <th className="px-6 py-4 font-semibold">Txn Reference</th>
                  <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Loading financial ledger...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No transaction records found matching filter.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const u = tx.user || {};
                    return (
                      <tr key={tx._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{u.username || "Unknown"}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              tx.provider === "esewa"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {tx.provider}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-300 font-medium capitalize">
                          {tx.plan?.replace("_", " ")}
                        </td>

                        <td className="px-6 py-4 font-bold text-white">
                          Rs. {tx.amount}
                        </td>

                        <td className="px-6 py-4">
                          {tx.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : tx.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-800/60 text-amber-400 text-[11px] font-semibold">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-800/60 text-rose-400 text-[11px] font-semibold">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                          {tx.transactionUuid}
                        </td>

                        <td className="px-6 py-4">
                          {tx.refundStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-900/30 text-sky-400 text-[10px] font-semibold border border-sky-800/50">Refunded</span>
                          ) : tx.refundStatus === "requested" ? (
                            <button
                              onClick={() => handleRefund(tx._id, tx.refundStatus)}
                              disabled={refundLoading === tx._id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-[10px] font-semibold border border-amber-800/50 hover:bg-amber-900/50 transition-colors"
                            >
                              Approve Refund
                            </button>
                          ) : tx.status === "completed" ? (
                            <button
                              onClick={() => handleRefund(tx._id, tx.refundStatus || "none")}
                              disabled={refundLoading === tx._id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] hover:text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Refund
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-400 text-right">
                          {new Date(tx.createdAt).toLocaleString()}
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
