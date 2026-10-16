"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Heart,
  Globe,
  Flame,
  Layers,
  RefreshCw,
  MapPin,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "revenue" | "cohorts" | "funnel" | "geo" | "matchQuality" | "fatigue"
  >("revenue");

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [matchQualityData, setMatchQualityData] = useState<any>(null);
  const [fatigueData, setFatigueData] = useState<any>(null);

  const fetchAllAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [rev, coh, fun, geo, mq, fat] = await Promise.all([
        adminApi.getRevenueAnalytics().catch(() => null),
        adminApi.getCohortAnalytics().catch(() => null),
        adminApi.getFunnelAnalytics().catch(() => null),
        adminApi.getGeoAnalytics().catch(() => null),
        adminApi.getMatchQualityMetrics().catch(() => null),
        adminApi.getSwipeFatigueTracker().catch(() => null),
      ]);
      setRevenueData(rev);
      setCohortData(coh);
      setFunnelData(fun);
      setGeoData(geo);
      setMatchQualityData(mq);
      setFatigueData(fat);
    } catch (err) {
      console.error("Failed to load business intelligence:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Color helper for cohort retention matrix
  const getRetentionColor = (rate: number | null) => {
    if (rate === null) return "bg-slate-900 text-slate-600";
    if (rate >= 60) return "bg-emerald-600/40 text-emerald-300 font-bold border border-emerald-500/30";
    if (rate >= 40) return "bg-emerald-800/30 text-emerald-400 font-semibold border border-emerald-700/30";
    if (rate >= 20) return "bg-amber-600/30 text-amber-300 font-medium border border-amber-600/30";
    if (rate >= 10) return "bg-amber-800/20 text-amber-400 border border-amber-800/20";
    return "bg-rose-950/40 text-rose-400 border border-rose-900/30";
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Business Intelligence & Analytics Hub"
        description="Monitor platform monetization, cohort retention, conversion funnel, location heatmaps, and matchmaking health"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/90 border border-slate-800 p-1 rounded-2xl w-full md:w-auto">
            {[
              { id: "revenue", label: "Revenue & MRR", icon: DollarSign },
              { id: "cohorts", label: "Cohort Retention", icon: Layers },
              { id: "funnel", label: "Conversion Funnel", icon: TrendingUp },
              { id: "geo", label: "Geo Heatmap", icon: Globe },
              { id: "matchQuality", label: "Match Quality", icon: Heart },
              { id: "fatigue", label: "Swipe Fatigue", icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAllAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50 ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Recalculate Metrics</span>
          </button>
        </div>

        {/* 1. REVENUE & MONETIZATION SECTION */}
        {activeTab === "revenue" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Monthly Recurring Revenue (MRR)
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  NPR {Number(revenueData?.mrr || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  ARR Run-Rate: NPR {Number(revenueData?.arr || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Gross Revenue
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  NPR {Number(revenueData?.totalRevenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  From {revenueData?.completedTransactions || 0} completed payments
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Premium Subscribers
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {revenueData?.activeSubscribers || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Paying active subscribers
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  ARPPU / ARPU
                </span>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  NPR {revenueData?.arppu || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Per user ARPU: NPR {revenueData?.arpu || 0}
                </div>
              </div>
            </div>

            {/* Daily Revenue Chart & Provider Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Bar Chart */}
              <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Daily Revenue (Last 90 Days)</h3>
                    <p className="text-xs text-slate-400">Completed purchases time series</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Live Payment Ledger
                  </span>
                </div>

                {revenueData?.dailyRevenue?.length > 0 ? (
                  <div className="h-64 flex items-end gap-1.5 pt-6 pb-2 overflow-x-auto">
                    {revenueData.dailyRevenue.map((d: any) => {
                      const maxRevenue = Math.max(...revenueData.dailyRevenue.map((r: any) => r.revenue), 1000);
                      const heightPct = Math.max(10, Math.round((d.revenue / maxRevenue) * 100));

                      return (
                        <div key={d.date} className="flex-1 min-w-[28px] flex flex-col items-center gap-1 group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-12 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                            <div>{d.date}</div>
                            <div className="text-emerald-400 font-bold">NPR {d.revenue} ({d.count} sales)</div>
                          </div>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md group-hover:from-rose-500 group-hover:to-rose-300 transition-all shadow-sm"
                          />
                          <span className="text-[9px] text-slate-500 truncate w-full text-center">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    <DollarSign className="w-8 h-8 text-slate-600 mb-2" />
                    <span>No completed daily transactions recorded in the window.</span>
                  </div>
                )}
              </div>

              {/* Payment Gateway Split */}
              <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Payment Gateway Breakdown</h3>
                <p className="text-xs text-slate-400">Transaction volume by provider</p>

                {revenueData?.providerBreakdown?.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {revenueData.providerBreakdown.map((p: any) => {
                      const totalRev = revenueData.totalRevenue || 1;
                      const pct = Math.round((p.revenue / totalRev) * 100);
                      const isEsewa = p.provider?.toLowerCase().includes("esewa");

                      return (
                        <div key={p.provider} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isEsewa ? "bg-emerald-400" : "bg-purple-400"
                                }`}
                              />
                              {p.provider}
                            </span>
                            <span className="font-semibold text-emerald-400">NPR {p.revenue}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full ${isEsewa ? "bg-emerald-500" : "bg-purple-500"}`}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>{p.count} transactions</span>
                            <span>{pct}% of volume</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No gateway transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. COHORT RETENTION SECTION */}
        {activeTab === "cohorts" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly User Cohort Retention Matrix</h3>
              <p className="text-xs text-slate-400">
                Percentage of registered users active after Day 1, Day 7, Day 14, and Day 30 post-signup
              </p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                    <th className="py-3 px-4">Signup Cohort</th>
                    <th className="py-3 px-4">Cohort Size</th>
                    <th className="py-3 px-4 text-center">Day 1</th>
                    <th className="py-3 px-4 text-center">Day 7</th>
                    <th className="py-3 px-4 text-center">Day 14</th>
                    <th className="py-3 px-4 text-center">Day 30</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {cohortData?.cohorts?.map((c: any) => (
                    <tr key={c.startDate} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                        {c.cohort}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {c.size} users
                      </td>

                      {[c.day1, c.day7, c.day14, c.day30].map((rate, idx) => (
                        <td key={idx} className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block w-16 py-1.5 rounded-lg text-xs ${getRetentionColor(
                              rate
                            )}`}
                          >
                            {rate !== null ? `${rate}%` : "—"}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-4 pt-4 text-[11px] text-slate-400 border-t border-slate-800">
              <span className="font-semibold text-slate-300">Retention Heat Scale:</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/30" /> 60%+</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-800/40 border border-emerald-700/30" /> 40-59%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-600/30 border border-amber-600/30" /> 20-39%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-950/40 border border-rose-900/30" /> &lt;20%</span>
            </div>
          </div>
        )}

        {/* 3. CONVERSION FUNNEL SECTION */}
        {activeTab === "funnel" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Dating App Lifecycle Funnel</h3>
                <p className="text-xs text-slate-400">
                  Step-by-step conversion drop-off from registration to paying subscriber
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Overall Conversion</span>
                <span className="text-xl font-bold text-emerald-400">{funnelData?.overallConversion || 0}%</span>
              </div>
            </div>

            <div className="space-y-4">
              {funnelData?.funnel?.map((step: any, index: number) => {
                const colors = [
                  "from-rose-500 to-rose-600",
                  "from-pink-500 to-pink-600",
                  "from-purple-500 to-purple-600",
                  "from-indigo-500 to-indigo-600",
                  "from-sky-500 to-sky-600",
                  "from-emerald-500 to-emerald-600",
                ];
                const gradient = colors[index % colors.length];

                return (
                  <div key={step.name} className="space-y-1.5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-[11px]">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-white">{step.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-mono text-slate-300">{step.count.toLocaleString()} users</span>
                        <span className="font-bold text-emerald-400">{step.overallConversionRate}% of total</span>
                        {index > 0 && (
                          <span className="text-rose-400 text-[11px] font-medium">
                            ↓ {step.dropOffRate}% drop
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        style={{ width: `${Math.max(3, step.overallConversionRate)}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 shadow-sm`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. GEOGRAPHIC HEATMAP & LOCATION DENSITY */}
        {activeTab === "geo" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Density Table */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Top Cities & Regional Density</h3>
                  <p className="text-xs text-slate-400">
                    Geographic distribution of dating profiles across Nepal & abroad
                  </p>
                </div>

                <div className="space-y-3">
                  {geoData?.topLocations?.map((loc: any) => (
                    <div key={loc.city} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-bold text-white">{loc.city}</span>
                        </div>
                        <span className="font-mono text-slate-300">
                          {loc.users} users ({loc.percentage}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, loc.percentage * 2)}%` }}
                          className="h-full bg-rose-500 rounded-full"
                        />
                      </div>

                      <div className="flex items-center gap-4 text-[10px] text-slate-400">
                        <span>Male: <strong className="text-white">{loc.male}</strong></span>
                        <span>Female: <strong className="text-white">{loc.female}</strong></span>
                        <span>Verified: <strong className="text-sky-400">{loc.verified}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geo Points & GPS Coverage */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Live GPS Coordinate Clusters</h3>
                <p className="text-xs text-slate-400">
                  {geoData?.geoPoints?.length || 0} real-time user GPS lat/lng points captured
                </p>

                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {geoData?.geoPoints?.map((p: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{p.city}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}]
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MATCH QUALITY & CHAT HEALTH */}
        {activeTab === "matchQuality" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Mutual Match Rate
                </span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {matchQualityData?.mutualMatchRate || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {matchQualityData?.totalMatchesFormed || 0} matches from {matchQualityData?.totalLikesSent || 0} right swipes
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Conversation Start Rate
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {matchQualityData?.conversationStartRate || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {matchQualityData?.chatsWithMessages || 0} matches initiated messaging
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Deep Conversations (10+ Msgs)
                </span>
                <div className="text-2xl font-black text-sky-400 mt-1">
                  {matchQualityData?.deepConversationRate || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {matchQualityData?.deepConversationsCount || 0} conversations sustained
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Avg Messages / Thread
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {matchQualityData?.avgMessagesPerChat || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Across {matchQualityData?.totalChats || 0} chat channels
                </div>
              </div>
            </div>

            {/* Quality Summary Assessment */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Algorithm & Match Health Scorecard</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Match Engagement</span>
                    <span className="text-emerald-400 font-bold">Good</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Over {matchQualityData?.conversationStartRate || 0}% of mutual matches lead to an active conversation thread.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Connection Depth</span>
                    <span className="text-sky-400 font-bold">Healthy</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Average thread depth is {matchQualityData?.avgMessagesPerChat || 0} messages before numbers are exchanged or plans made.
                  </p>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Ghosting Risk</span>
                    <span className="text-amber-400 font-bold">Moderate</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    {Math.max(0, 100 - (matchQualityData?.conversationStartRate || 0))}% of matches remain silent without an icebreaker.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. SWIPE FATIGUE TRACKER */}
        {activeTab === "fatigue" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Overall Right Swipe Ratio
                </span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {fatigueData?.overallRightSwipeRatio || 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Global likes vs passes distribution
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  High-Fatigue Outliers
                </span>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {fatigueData?.fatiguedCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Users with high volume & &lt;10% match yield
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Burnout Risk
                </span>
                <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Recommendation Boost Active
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Algorithm automatically boosts fatigued users
                </div>
              </div>
            </div>

            {/* Fatigue Candidates Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Burnout & Fatigue Candidates</h3>
                <p className="text-xs text-slate-400">
                  Users experiencing high swipe activity with disproportionately low match return rates
                </p>
              </div>

              {fatigueData?.fatiguedUsers?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Total Swipes</th>
                        <th className="py-3 px-4">Likes vs Passes</th>
                        <th className="py-3 px-4">Matches</th>
                        <th className="py-3 px-4">Match Return Rate</th>
                        <th className="py-3 px-4">Fatigue Index</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {fatigueData.fatiguedUsers.map((u: any) => (
                        <tr key={u.profileId} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {u.profileImage ? (
                                <img
                                  src={u.profileImage}
                                  alt=""
                                  className="w-8 h-8 rounded-xl object-cover bg-slate-900"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                  {u.name?.charAt(0) || "?"}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white">{u.name}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  @{u.user?.username || "unknown"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-300">{u.totalSwipes}</td>

                          <td className="py-3 px-4 text-slate-400">
                            {u.rightSwipes} likes / {u.leftSwipes} passes
                          </td>

                          <td className="py-3 px-4 font-bold text-white">{u.matches}</td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                              {u.matchRate}%
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">{u.fatigueScore}/100</span>
                              <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${u.fatigueScore}%` }}
                                  className="h-full bg-amber-500"
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {u.user && (
                              <Link
                                href={`/users/${u.user._id}`}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                              >
                                View Profile
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  <span>No high-fatigue swipe outliers detected! User matchmaking balance is healthy.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
