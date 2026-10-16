"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ImageIcon,
  Mic,
  Video,
  Phone,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-3.5 h-3.5" />,
  image: <ImageIcon className="w-3.5 h-3.5" />,
  audio: <Mic className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  image: "Image",
  audio: "Voice",
  video: "Video",
  call: "Call",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ChatModerationPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const PAGE_SIZE = 30;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getMessages({ search, type: typeFilter, page });
      setMessages(res.messages || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputSearch);
    setPage(1);
  };

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId);
    try {
      await adminApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setTotal((t) => t - 1);
    } catch (e: any) {
      alert(e?.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const renderContent = (msg: any) => {
    if (msg.type === "text") return <span className="text-slate-200">{msg.text}</span>;
    if (msg.type === "image") return <span className="text-slate-400 italic">📷 Image message</span>;
    if (msg.type === "audio") return <span className="text-slate-400 italic">🎤 Voice message ({msg.audio?.duration || 0}s)</span>;
    if (msg.type === "video") return <span className="text-slate-400 italic">🎥 Video message</span>;
    if (msg.type === "call") return <span className="text-slate-400 italic">📞 Call ({msg.call?.status})</span>;
    return <span className="text-slate-500">Unknown</span>;
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Chat Moderation"
        description="Browse, search, and remove messages across all user conversations"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                placeholder="Search message text…"
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
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="audio">Voice</option>
              <option value="video">Video</option>
              <option value="call">Call</option>
            </select>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MessageSquare className="w-4 h-4" />
          <span>{total.toLocaleString()} messages</span>
          {(search || typeFilter) && (
            <button
              onClick={() => { setSearch(""); setInputSearch(""); setTypeFilter(""); setPage(1); }}
              className="ml-2 text-violet-400 hover:text-violet-300 text-xs underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Messages Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3.5">Sender</th>
                  <th className="text-left px-5 py-3.5">Type</th>
                  <th className="text-left px-5 py-3.5">Content</th>
                  <th className="text-left px-5 py-3.5">Time</th>
                  <th className="text-right px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      No messages found
                    </td>
                  </tr>
                ) : (
                  messages.map((msg) => (
                    <tr key={msg._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-slate-200">{msg.sender?.username || "Unknown"}</p>
                          <p className="text-xs text-slate-500">{msg.sender?.email}</p>
                          {msg.sender?.profile?.name && (
                            <p className="text-xs text-slate-500">{msg.sender.profile.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                          {TYPE_ICONS[msg.type] || TYPE_ICONS.text}
                          {TYPE_LABELS[msg.type] || msg.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="truncate text-sm">{renderContent(msg)}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {timeAgo(msg.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {confirmDelete === msg._id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(msg._id)}
                              disabled={deletingId === msg._id}
                              className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {deletingId === msg._id ? "Removing…" : "Confirm"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(msg._id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors"
                            title="Remove message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages} ({total} total)
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
