"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Zap,
  Ban,
  Snowflake,
  Eraser,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface SuspiciousBot {
  user: {
    _id: string;
    username: string;
    email: string;
    createdAt: string;
    frozen?: boolean;
  };
  profile: {
    name?: string;
    profileImage?: string;
    aboutMe?: string;
    verified?: boolean;
  };
  riskScore: number;
  riskLevel: "critical" | "high" | "medium";
  riskFlags: string[];
  stats: {
    totalSwipes: number;
    rightSwipes: number;
    leftSwipes: number;
    matches: number;
  };
}

export default function BotDetectionPage() {
  const [bots, setBots] = useState<SuspiciousBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState<number>(30);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [totalDetected, setTotalDetected] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBots = async (score = minScore) => {
    setLoading(true);
    try {
      const res = await adminApi.getSuspiciousBots(score);
      setBots(res.bots || []);
      setTotalDetected(res.totalDetected || 0);
      setCriticalCount(res.criticalCount || 0);
      setHighRiskCount(res.highRiskCount || 0);
    } catch (err: any) {
      console.error("Failed to load suspicious bots:", err);
      setNotification({ type: "error", text: "Failed to load bot detection list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots(minScore);
  }, [minScore]);

  const handleAction = async (userId: string, action: string, username: string) => {
    let confirmPrompt = `Execute "${action.toUpperCase()}" on @${username}?`;
    if (action === "ban") {
      confirmPrompt = `Are you sure you want to PERMANENTLY BAN @${username}? This immediately cuts off app access.`;
    } else if (action === "freeze") {
      confirmPrompt = `Temporarily freeze @${username}'s account pending review?`;
    }

    if (!confirm(confirmPrompt)) return;

    setActionLoading(`${userId}_${action}`);
    try {
      const res = await adminApi.takeBotAction(userId, action);
      setNotification({ type: "success", text: res.message || `Action ${action} completed.` });
      // Remove from list or update local state
      setBots((prev) => prev.filter((b) => b.user._id !== userId));
      setTotalDetected((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || `Failed to take action ${action}` });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBots = bots.filter((b) => {
    const matchesSearch =
      b.user.username.toLowerCase().includes(search.toLowerCase()) ||
      b.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (b.profile.name || "").toLowerCase().includes(search.toLowerCase()) ||
      b.riskFlags.some((f) => f.toLowerCase().includes(search.toLowerCase()));

    const matchesLevel =
      filterLevel === "all" || b.riskLevel === filterLevel;

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Bot & Fake Profile Hunter"
        description="Automated behavioral heuristics identifying click-farms, 99% right-swipe spammers, telegram/cashapp solicitations, and velocity anomalies."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Toast Notification */}
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
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Suspicious
              </span>
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {totalDetected}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Exceeding score ≥ {minScore}</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Critical Danger
              </span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
              {criticalCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Score ≥ 70 (high certainty bot/scam)</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                High Risk Warning
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
              {highRiskCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Score 45 - 69 (abnormal behavior)</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Sensitivity Gate
              </span>
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <span className="text-sm font-bold text-white font-mono w-8 text-right">
                {minScore}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Lower = catches more subtle patterns</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by username, flag, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
              {(["all", "critical", "high", "medium"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] transition-all ${
                    filterLevel === lvl
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchBots(minScore)}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Detection Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Bot List Cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Scanning user swipe behaviors, bios, and account velocities...
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Suspicious Bots Detected</h3>
            <p className="text-xs text-slate-400 mt-1">
              No active users exceed the current risk score threshold ({minScore}).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBots.map((bot) => {
              const likeRate =
                bot.stats.totalSwipes > 0
                  ? Math.round((bot.stats.rightSwipes / bot.stats.totalSwipes) * 100)
                  : 0;

              return (
                <div
                  key={bot.user._id}
                  className={`bg-slate-900/90 border rounded-2xl p-5 sm:p-6 transition-all ${
                    bot.riskLevel === "critical"
                      ? "border-rose-500/40 shadow-lg shadow-rose-950/20"
                      : bot.riskLevel === "high"
                      ? "border-amber-500/30"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* User Identity & Avatar */}
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {bot.profile.profileImage ? (
                          <img
                            src={bot.profile.profileImage}
                            alt={bot.user.username}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-800"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-lg">
                            {bot.user.username[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        {bot.profile.verified && (
                          <span className="absolute -top-1 -right-1 bg-sky-500 text-white rounded-full p-0.5">
                            <UserCheck className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">
                            {bot.profile.name || bot.user.username}
                          </h3>
                          <span className="text-xs text-slate-500">@{bot.user.username}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                              bot.riskLevel === "critical"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : bot.riskLevel === "high"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            }`}
                          >
                            Risk: {bot.riskScore} / 100 ({bot.riskLevel})
                          </span>
                          {bot.user.frozen && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                              Frozen
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          {bot.user.email} • Joined: {new Date(bot.user.createdAt).toLocaleDateString()}
                        </p>

                        {/* Bio preview if exists */}
                        {bot.profile.aboutMe && (
                          <p className="text-xs text-slate-300 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 mt-2.5 max-w-2xl line-clamp-2 italic">
                            &ldquo;{bot.profile.aboutMe}&rdquo;
                          </p>
                        )}

                        {/* Triggered heuristic flags */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {bot.riskFlags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[11px] font-medium flex items-center gap-1.5"
                            >
                              <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>{flag}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 border-slate-800 pt-4 lg:pt-0">
                      {/* Swipe Stats Mini Grid */}
                      <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Swipes</div>
                          <div className="text-xs font-bold text-white font-mono">{bot.stats.totalSwipes}</div>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Like %</div>
                          <div className={`text-xs font-bold font-mono ${likeRate >= 90 ? "text-rose-400" : "text-slate-300"}`}>
                            {likeRate}%
                          </div>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Matches</div>
                          <div className="text-xs font-bold text-white font-mono">{bot.stats.matches}</div>
                        </div>
                      </div>

                      {/* Quick Moderation Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/users/${bot.user._id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Profile</span>
                        </Link>

                        {bot.profile.aboutMe && (
                          <button
                            onClick={() => handleAction(bot.user._id, "clear_bio", bot.user.username)}
                            disabled={actionLoading === `${bot.user._id}_clear_bio`}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            title="Strip commercial/spam bio text"
                          >
                            <Eraser className="w-3 h-3" />
                            <span>Wipe Bio</span>
                          </button>
                        )}

                        {!bot.user.frozen && (
                          <button
                            onClick={() => handleAction(bot.user._id, "freeze", bot.user.username)}
                            disabled={actionLoading === `${bot.user._id}_freeze`}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            title="Temporarily freeze swipe privileges"
                          >
                            <Snowflake className="w-3 h-3" />
                            <span>Freeze</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleAction(bot.user._id, "ban", bot.user.username)}
                          disabled={actionLoading === `${bot.user._id}_ban`}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition-colors"
                          title="Permanently terminate account"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Ban Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
