"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Mic,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

// Custom Audio Player Component for Voice Prompts
function AudioPreviewPlayer({ audioUrl, duration }: { audioUrl: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = newSpeed;
    setPlaybackSpeed(newSpeed);
  };

  return (
    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-100"
              style={{
                width: `${
                  duration && duration > 0 ? (currentTime / duration) * 100 : currentTime ? 40 : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>{Math.floor(currentTime)}s</span>
            <span>{duration ? `${Math.floor(duration)}s` : "Voice Note"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSpeed}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300"
        >
          {playbackSpeed}x
        </button>
      </div>
    </div>
  );
}

export default function PromptsModerationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getPromptModerationStats();
      setStats(res);
    } catch (err: any) {
      console.error("Failed to load prompt stats:", err);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPromptModeration(statusFilter, typeFilter, page, search);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load prompt moderation items:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, page, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAction = async (id: string, action: "approve" | "remove" | "warn") => {
    let reason = "";
    if (action === "remove" || action === "warn") {
      const promptVal = prompt(
        action === "warn"
          ? "Enter warning message to send to the user:"
          : "Enter reason for prompt removal:"
      );
      if (promptVal === null) return;
      reason = promptVal;
    }

    setActionLoading(id);
    try {
      await adminApi.resolvePromptModeration(id, action, reason);
      fetchItems();
      fetchStats();
    } catch (err: any) {
      alert(err?.message || "Failed to resolve prompt moderation item");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Prompt & Voice Moderation"
        description="Review user-submitted voice notes, audio icebreakers, and dating prompt answers for community safety"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Metric Cards Header */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Voice Notes
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats?.pendingVoice ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Mic className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Text Prompts
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {stats?.pendingText ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Review Queue
              </div>
              <div className="text-2xl font-bold text-rose-400 mt-1">
                {stats?.pendingTotal ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Removed Today
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {stats?.totalRemovedToday ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              {["pending", "approved", "removed", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Type Pills */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              {[
                { key: "all", label: "All Types" },
                { key: "voice_prompt", label: "Voice Notes" },
                { key: "text_prompt", label: "Text Prompts" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTypeFilter(t.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    typeFilter === t.key
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search prompts or reasons..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={() => {
                fetchItems();
                fetchStats();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Prompts Cards Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-500 text-sm">
            Fetching prompt moderation items...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Queue Clean</h3>
            <p className="text-xs text-slate-500 mt-1">
              No prompts or voice notes currently require moderation under this filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const u = item.user || {};
              const p = item.profile || {};
              const isVoice = item.type === "voice_prompt";
              const isWorking = actionLoading === item._id;

              return (
                <div
                  key={item._id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* User Profile Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {p.profileImage ? (
                          <img
                            src={p.profileImage}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {p.name || u.username}
                            </span>
                            <span className="font-mono text-xs text-slate-400">
                              @{u.username}
                            </span>
                            {u._id && (
                              <Link
                                href={`/users/${u._id}`}
                                className="text-slate-400 hover:text-white"
                                title="Open full profile"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Trust: {u.trustScore ?? 100}/100</span>
                            <span>•</span>
                            <span className="capitalize">{item.type?.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          item.status === "approved"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : item.status === "removed"
                            ? "bg-rose-950 text-rose-400 border-rose-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Flag Reason Pill */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between">
                      <span className="text-slate-400">Flag Reason:</span>
                      <span className="font-semibold text-rose-400">{item.flagReason}</span>
                    </div>

                    {/* Content Display */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-300">
                        Q: &ldquo;{item.promptQuestion}&rdquo;
                      </div>

                      {isVoice ? (
                        <div className="space-y-2">
                          <AudioPreviewPlayer
                            audioUrl={item.audioUrl}
                            duration={item.duration}
                          />
                          {item.transcript && (
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                              <span className="font-bold text-slate-400 not-italic block text-[10px] uppercase tracking-wider mb-1">
                                Speech-to-text Transcription:
                              </span>
                              &ldquo;{item.transcript}&rdquo;
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                          &ldquo;{item.promptAnswer}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {item.status === "pending" && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleAction(item._id, "approve")}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleAction(item._id, "remove")}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Remove Prompt</span>
                      </button>
                      <button
                        onClick={() => handleAction(item._id, "warn")}
                        disabled={isWorking}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Warn User</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(total / 20) > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
