"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "text-sky-400 bg-sky-900/30 border-sky-800/50", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "text-amber-400 bg-amber-900/30 border-amber-800/50", icon: <Loader2 className="w-3 h-3" /> },
  resolved: { label: "Resolved", color: "text-emerald-400 bg-emerald-900/30 border-emerald-800/50", icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: "Closed", color: "text-slate-400 bg-slate-800/50 border-slate-700/50", icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-slate-400" },
  normal: { label: "Normal", color: "text-slate-300" },
  high: { label: "High", color: "text-amber-400" },
  urgent: { label: "Urgent", color: "text-rose-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  account: "Account",
  billing: "Billing",
  safety: "Safety",
  bug: "Bug",
  feature: "Feature",
  other: "Other",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function TicketDetailPanel({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: any;
  onClose: () => void;
  onUpdate: (t: any) => void;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [nextStatus, setNextStatus] = useState(ticket.status);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const updated = await adminApi.replyToTicket(ticket._id, replyBody.trim(), nextStatus);
      onUpdate(updated);
      setReplyBody("");
    } catch (e: any) {
      alert(e?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (s: string) => {
    try {
      const updated = await adminApi.updateTicket(ticket._id, { status: s });
      onUpdate(updated);
    } catch (e: any) {
      alert(e?.message || "Failed to update status");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={ticket.status} />
              <span className={`text-xs font-semibold ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                {PRIORITY_CONFIG[ticket.priority]?.label} Priority
              </span>
              <span className="text-xs text-slate-500">
                #{ticket._id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">{ticket.subject}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {ticket.user?.profile?.name || ticket.user?.username} · {ticket.user?.email} · {CATEGORY_LABELS[ticket.category]}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm px-2 py-1">✕</button>
        </div>

        {/* Status Controls */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 mr-1">Set status:</span>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                ticket.status === key
                  ? cfg.color
                  : "text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original message */}
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-sky-400">
                {ticket.user?.profile?.name || ticket.user?.username}
              </span>
              <span className="text-xs text-slate-500">{timeAgo(ticket.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{ticket.body}</p>
          </div>

          {/* Replies */}
          {ticket.replies?.map((reply: any, i: number) => (
            <div
              key={i}
              className={`rounded-xl p-4 ${
                reply.authorRole === "admin"
                  ? "bg-violet-900/20 border border-violet-800/30"
                  : "bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold ${
                    reply.authorRole === "admin" ? "text-violet-400" : "text-sky-400"
                  }`}
                >
                  {reply.authorRole === "admin" ? "Admin" : ticket.user?.username}
                </span>
                <span className="text-xs text-slate-500">{timeAgo(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-slate-400">Reply and set status to:</span>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Type your reply…"
              rows={3}
              className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !replyBody.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white transition-colors disabled:opacity-50 self-end"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, statsRes] = await Promise.all([
        adminApi.getTickets({ status: statusFilter, priority: priorityFilter, category: categoryFilter, search, page }),
        adminApi.getTicketStats(),
      ]);
      setTickets(res.tickets || []);
      setTotal(res.total || 0);
      setStats(statsRes);
    } catch (e: any) {
      setError(e?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTicketUpdate = (updated: any) => {
    setTickets((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
    setSelectedTicket(updated);
    load();
  };

  const openTicket = async (t: any) => {
    try {
      const full = await adminApi.getTicket(t._id);
      setSelectedTicket(full);
    } catch {
      setSelectedTicket(t);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
        />
      )}

      <Header
        title="Support Tickets"
        description="Manage user support requests and respond to queries"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "open", label: "Open", color: "text-sky-400" },
              { key: "in_progress", label: "In Progress", color: "text-amber-400" },
              { key: "resolved", label: "Resolved", color: "text-emerald-400" },
              { key: "total", label: "Total", color: "text-slate-300" },
            ].map(({ key, label, color }) => (
              <div key={key} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{stats[key] ?? 0}</p>
              </div>
            ))}
          </div>
        )}

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
                placeholder="Search subject or body…"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Priority</option>
              {Object.keys(PRIORITY_CONFIG).map((k) => (
                <option key={k} value={k}>{PRIORITY_CONFIG[k].label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
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

        {/* Tickets Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3.5">User</th>
                  <th className="text-left px-5 py-3.5">Subject</th>
                  <th className="text-left px-5 py-3.5">Category</th>
                  <th className="text-left px-5 py-3.5">Priority</th>
                  <th className="text-left px-5 py-3.5">Status</th>
                  <th className="text-left px-5 py-3.5">Replies</th>
                  <th className="text-left px-5 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-slate-800 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : tickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t._id}
                        onClick={() => openTicket(t)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-200">
                            {t.user?.profile?.name || t.user?.username}
                          </p>
                          <p className="text-xs text-slate-500">{t.user?.email}</p>
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          <p className="text-slate-200 truncate">{t.subject}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                            {CATEGORY_LABELS[t.category] || t.category}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-medium ${PRIORITY_CONFIG[t.priority]?.color || "text-slate-300"}`}>
                            {PRIORITY_CONFIG[t.priority]?.label || t.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-center">
                          {t.replies?.length || 0}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                          {timeAgo(t.createdAt)}
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
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
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
