"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  TrendingUp,
  Heart,
  MessageCircle,
  Eye,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Operations & Analytics Overview"
        description="Live platform activity, recommendation metrics, and discovery funnel"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">System Vital Signs</h2>
            <p className="text-xs text-slate-400">Aggregated over the last 30 rolling days</p>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Registered Users */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registered Daters
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white">
              {loading ? "..." : (data?.totalUsers ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total active database profiles</p>
          </div>

          {/* Daily Active Users (DAU) */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Today (DAU)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-emerald-400">
              {loading ? "..." : (data?.dau ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Users online within last 24h</p>
          </div>

          {/* Weekly Active Users (WAU) */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Weekly (WAU)
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-sky-400">
              {loading ? "..." : (data?.wau ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Engagement over last 7 days</p>
          </div>

          {/* 7-Day Retention */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                7-Day Retention
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-purple-400">
              {loading ? "..." : `${data?.retention?.sevenDayRetentionPct ?? 0}%`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cohort retention coefficient</p>
          </div>
        </div>

        {/* Discovery & Recommendation Funnel */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Discovery & Conversion Funnel</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  30-Day Aggregate
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates algorithmic feed efficacy from swipe impressions down to sustained conversations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Impressions</span>
              </div>
              <div className="text-xl font-bold text-white">
                {(data?.funnel?.impressions ?? 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Feed cards served</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Like Rate</span>
              </div>
              <div className="text-xl font-bold text-rose-400">
                {data?.funnel?.likeRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Likes / Impressions</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Match Rate</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">
                {data?.funnel?.matchRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Mutual likes achieved</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>Reply Rate</span>
              </div>
              <div className="text-xl font-bold text-purple-400">
                {data?.funnel?.replyRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Chat response rate</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Sustained Chats</span>
              </div>
              <div className="text-xl font-bold text-amber-400">
                {data?.funnel?.sustainedConversationRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Long-term dialogues</div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pass Rate</span>
              </div>
              <div className="text-xl font-bold text-slate-300">
                {data?.funnel?.passRate ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Skipped profiles</div>
            </div>
          </div>
        </div>

        {/* Quick Operations Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/verifications"
            className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-rose-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                  Verification Desk
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Photo Verification Queue</h4>
              <p className="text-xs text-slate-400">
                Review live pose selfies side-by-side with profile pictures and grant verified badges.
              </p>
            </div>
            <span className="mt-4 text-xs font-medium text-rose-400 group-hover:underline">
              Review Submissions →
            </span>
          </Link>

          <Link
            href="/reports"
            className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Trust & Safety
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">User Reports & Moderation</h4>
              <p className="text-xs text-slate-400">
                Investigate harassment, impersonation, or fake account flags and take prompt action.
              </p>
            </div>
            <span className="mt-4 text-xs font-medium text-amber-400 group-hover:underline">
              Resolve Open Flags →
            </span>
          </Link>

          <Link
            href="/transactions"
            className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Monetization
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">eSewa & Khalti Ledger</h4>
              <p className="text-xs text-slate-400">
                Audit transactions, track subscriber GMV, and reconcile payment gateways.
              </p>
            </div>
            <span className="mt-4 text-xs font-medium text-emerald-400 group-hover:underline">
              View Transactions →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
