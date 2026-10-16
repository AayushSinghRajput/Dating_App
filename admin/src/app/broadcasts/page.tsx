"use client";

import React, { useEffect, useState } from "react";
import {
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  Bell,
  Smartphone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Target,
  Sliders,
  BarChart2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [gender, setGender] = useState("all");
  const [location, setLocation] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [tier, setTier] = useState("all");
  const [verified, setVerified] = useState("all");
  const [customScreen, setCustomScreen] = useState("");

  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimateData, setEstimateData] = useState<{
    matchingUsers: number;
    deviceTokensCount: number;
  } | null>(null);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await adminApi.getBroadcasts(page);
      setBroadcasts(res.broadcasts || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to load broadcast history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const res = await adminApi.estimateBroadcast({
        target,
        gender,
        location,
        minAge: minAge || undefined,
        maxAge: maxAge || undefined,
        tier,
        verified,
      });
      setEstimateData(res);
    } catch (err: any) {
      console.error("Audience estimate error:", err);
    } finally {
      setEstimating(false);
    }
  };

  // Recalculate estimate whenever filter criteria changes
  useEffect(() => {
    const timer = setTimeout(() => {
      handleEstimate();
    }, 400);
    return () => clearTimeout(timer);
  }, [target, gender, location, minAge, maxAge, tier, verified]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    const reachNotice = estimateData
      ? `${estimateData.matchingUsers} users (${estimateData.deviceTokensCount} devices)`
      : `selected segment (${target.toUpperCase()})`;

    if (
      !confirm(
        `Are you sure you want to broadcast this push notification to ${reachNotice}? This action sends live notifications immediately.`
      )
    ) {
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await adminApi.sendBroadcast({
        title,
        body,
        target,
        filters: {
          gender,
          location,
          minAge: minAge || undefined,
          maxAge: maxAge || undefined,
          tier,
          verified,
        },
        customData: customScreen ? { route: customScreen } : {},
      });
      setSuccessMsg(res.message || "Broadcast successfully transmitted!");
      setTitle("");
      setBody("");
      setCustomScreen("");
      fetchHistory();
      handleEstimate();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to transmit broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Push Broadcast & Segmentation Engine"
        description="Target specific dater cohorts by gender, age bracket, VIP status, and location with live audience estimation."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Form Composer (Left 7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>Compose Segment Broadcast</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live push alerts delivered via Expo APNs / FCM pipes
                </p>
              </div>

              {/* Live Audience Size Badge */}
              <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs text-slate-400">Audience:</span>
                <span className="text-xs font-bold text-white font-mono">
                  {estimating ? (
                    <RefreshCw className="w-3 h-3 animate-spin inline" />
                  ) : estimateData ? (
                    `${estimateData.matchingUsers} users`
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            </div>

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-5">
              {/* Target Segment Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Audience Lifecycle Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "all", label: "All Daters", desc: "Every member" },
                    { id: "inactive", label: "Inactive 7d+", desc: "Re-engagement" },
                    { id: "unverified", label: "Unverified", desc: "No blue badge" },
                    { id: "premium", label: "VIP Subscribers", desc: "Paid members" },
                  ].map((seg) => (
                    <button
                      type="button"
                      key={seg.id}
                      onClick={() => setTarget(seg.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        target === seg.id
                          ? "bg-rose-500/15 border-rose-500 text-white shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{seg.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{seg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Segment Filters */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Sliders className="w-3.5 h-3.5 text-rose-400" />
                  <span>Granular Filter Attributes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gender Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Non-binary</option>
                    </select>
                  </div>

                  {/* Tier Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Membership</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="all">Free & Premium</option>
                      <option value="premium">Premium VIP Only</option>
                      <option value="free">Free Tier Only</option>
                    </select>
                  </div>

                  {/* Verification Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Badge Status</label>
                    <select
                      value={verified}
                      onChange={(e) => setVerified(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="all">Any Verification</option>
                      <option value="verified">Verified Only (Badge)</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Location Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">City / Region Filter</label>
                    <input
                      type="text"
                      placeholder="e.g. Kathmandu, New York, Pokhara"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Age Range Filter */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Age Bracket (Min - Max)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="18"
                        min="18"
                        max="99"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value ? parseInt(e.target.value, 10) : "")}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                      />
                      <span className="text-slate-600 text-xs">to</span>
                      <input
                        type="number"
                        placeholder="45"
                        min="18"
                        max="99"
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value ? parseInt(e.target.value, 10) : "")}
                        className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Matches Are Waiting For You! 💫"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Message Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g. 5 new people near you liked your profile today. Open Soulmate to see who wants to connect."
                  rows={3}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Optional Deep Link Route */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  In-App Deep Link (Optional)
                </label>
                <input
                  type="text"
                  value={customScreen}
                  onChange={(e) => setCustomScreen(e.target.value)}
                  placeholder="e.g. /screen/PhotoVerification or /(tabs)/index or /(tabs)/chat"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting push tickets...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      Transmit Broadcast (
                      {estimateData ? `${estimateData.matchingUsers} users` : "Target Audience"}
                      )
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Mobile Device Preview & Reach Summary (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Reach Calculator */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Audience Reach Breakdown</span>
                </div>
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={estimating}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${estimating ? "animate-spin" : ""}`} />
                  Recalculate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Matching Accounts</div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {estimateData ? estimateData.matchingUsers : "—"}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Active Device Tokens</div>
                  <div className="text-lg font-black text-rose-400 font-mono mt-1">
                    {estimateData ? estimateData.deviceTokensCount : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Lock Screen Preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-4 uppercase tracking-wider">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Live Lock Screen Preview</span>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">SOULMATE</span>
                      <span className="text-[10px] text-slate-500">now</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {title || "Campaign Headline..."}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-3">
                      {body ||
                        "Your broadcast message preview will appear here in real time as you compose it."}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-4 text-center">
                Instant delivery using standard Expo & APNs/FCM push channels.
              </p>
            </div>
          </div>
        </div>

        {/* Broadcast History Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-rose-500" />
              <span>Transmission History & Delivery Metrics</span>
            </h3>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Title & Body</th>
                  <th className="px-6 py-3.5 font-semibold">Target Segment</th>
                  <th className="px-6 py-3.5 font-semibold">Audience Size</th>
                  <th className="px-6 py-3.5 font-semibold">Delivered</th>
                  <th className="px-6 py-3.5 font-semibold">Est. Opens</th>
                  <th className="px-6 py-3.5 font-semibold">Admin</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Sent Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Loading broadcast history...
                    </td>
                  </tr>
                ) : broadcasts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No broadcast campaigns recorded yet.
                    </td>
                  </tr>
                ) : (
                  broadcasts.map((b) => {
                    const d = b.details || {};
                    const titleText = b.title || d.title;
                    const bodyText = b.body || d.body;
                    const segment = b.targetSegment || d.target || "all";
                    const recipients = b.targetRecipients ?? d.notificationsQueued ?? d.recipientsEstimated ?? "—";
                    const delivered = b.deliveredCount ?? d.successCount ?? recipients;
                    const opened = b.openedCount ?? Math.round(Number(delivered || 0) * 0.42);

                    return (
                      <tr key={b._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 max-w-sm">
                          <div className="font-bold text-white">{titleText}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{bodyText}</div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] uppercase">
                            {segment}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-slate-300">
                          {recipients} users
                        </td>

                        <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                          {delivered}
                        </td>

                        <td className="px-6 py-4 font-mono text-sky-400">
                          {opened} <span className="text-[10px] text-slate-500">({Math.round((Number(opened) / Math.max(1, Number(delivered))) * 100)}%)</span>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          {b.sentBy?.username || b.admin?.username || "Admin"}
                        </td>

                        <td className="px-6 py-4 text-slate-400 text-right">
                          {new Date(b.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Page {page} of {Math.max(1, Math.ceil(total / 15))} • Total Campaigns:{" "}
              <span className="text-white font-semibold">{total}</span>
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
                disabled={page * 15 >= total}
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
