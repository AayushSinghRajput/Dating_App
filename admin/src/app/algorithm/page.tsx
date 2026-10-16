"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRightLeft,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { UserSelector, SelectedUser } from "@/components/UserSelector";
import { adminApi } from "@/lib/api";

export default function AlgorithmPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Match explainer simulator state
  const [viewerUser, setViewerUser] = useState<SelectedUser | null>(null);
  const [targetUser, setTargetUser] = useState<SelectedUser | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Unshow match pair info as soon as either user is cleared
  useEffect(() => {
    if (!viewerUser || !targetUser) {
      setSimResult(null);
      setSimError(null);
    }
  }, [viewerUser, targetUser]);

  const handleClearAll = () => {
    setViewerUser(null);
    setTargetUser(null);
    setSimResult(null);
    setSimError(null);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAlgorithmConfig();
      setConfig(res);
    } catch (err) {
      console.error("Failed to load algorithm config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerUser?.id || !targetUser?.id) return;

    setExplaining(true);
    setSimResult(null);
    setSimError(null);

    try {
      const res = await adminApi.explainMatch(viewerUser.id, targetUser.id);
      setSimResult(res);
    } catch (err: any) {
      setSimError(err?.message || "Failed to inspect pair match score");
    } finally {
      setExplaining(false);
    }
  };

  const handleSwapUsers = () => {
    const temp = viewerUser;
    setViewerUser(targetUser);
    setTargetUser(temp);
  };

  const weights = config?.defaultWeights || {};

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Recommendation Engine & Weights"
        description="Inspect multi-stage candidate scoring weights, A/B experiment variants, and match explainability"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Vital Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pipeline Version
            </span>
            <div className="text-xl font-black text-rose-400 mt-1">
              {config?.version || "recommendation-v3"}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Multi-stage ranking pipeline</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Exploration Ratio
            </span>
            <div className="text-xl font-black text-white mt-1">
              {(config?.explorationRatio ?? 0.2) * 100}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Epsilon-greedy bandit allocation</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Diversity Window
            </span>
            <div className="text-xl font-black text-sky-400 mt-1">
              {config?.diversityWindow ?? 3} Profiles
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Re-ranking anti-fatigue window</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Logged Impressions
            </span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {(config?.totalImpressionsLogged ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Total candidate exposures</p>
          </div>
        </div>

        {/* Match Scoring Explainer Simulator */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" />
                <span>Match Scoring Inspector & Explainer</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Type names to search and select both daters from the dropdown to simulate and inspect pairwise ranking scores
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={!viewerUser && !targetUser && !simResult && !simError}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/60 text-xs font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Clear both fields and match info"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Viewer User Selector */}
              <div className="md:col-span-5">
                <UserSelector
                  label="Viewer Person (Requesting Dater)"
                  selectedUserId={viewerUser?.id || ""}
                  selectedUser={viewerUser}
                  onSelectUser={setViewerUser}
                  placeholder="Type name, username or email..."
                  badgeColor="rose"
                  dropdownPlacement="up"
                />
              </div>

              {/* Swap Button */}
              <div className="md:col-span-2 flex justify-center pt-4 md:pt-4">
                <button
                  type="button"
                  onClick={handleSwapUsers}
                  disabled={!viewerUser && !targetUser}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-all border border-slate-700/60 shadow-sm"
                  title="Swap Viewer and Target"
                  aria-label="Swap Viewer and Target"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Target User Selector */}
              <div className="md:col-span-5">
                <UserSelector
                  label="Target Person (Candidate to Match)"
                  selectedUserId={targetUser?.id || ""}
                  selectedUser={targetUser}
                  onSelectUser={setTargetUser}
                  placeholder="Type name, username or email..."
                  badgeColor="sky"
                  dropdownPlacement="up"
                />
              </div>
            </div>

            {/* Submission Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                {viewerUser && targetUser ? (
                  <span>
                    Ready to evaluate: <strong className="text-rose-400 font-semibold">{viewerUser.name}</strong> ↔ <strong className="text-sky-400 font-semibold">{targetUser.name}</strong>
                  </span>
                ) : (
                  <span>
                    Select both a viewer and a target person above to inspect algorithm feature weights.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={explaining || !viewerUser?.id || !targetUser?.id}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl font-semibold text-xs bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
              >
                {explaining ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Pair...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Inspect Match Explanation</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {simError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
              {simError}
            </div>
          )}

          {simResult && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="text-xs font-bold text-white">
                  Match Pair: <span className="text-rose-400">{simResult.viewer.name}</span> &{" "}
                  <span className="text-sky-400">{simResult.target.name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Experiment Variant:{" "}
                  <span className="font-mono text-slate-300 uppercase">
                    {simResult.experimentVariant}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Generated Reasons for Discovery Feed:
                </span>
                {simResult.reasons.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No reasons generated above the 0.6 contribution threshold.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {simResult.reasons.map((r: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {simResult.recordedFeatures && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Recorded Feature Scores:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    {Object.entries(simResult.recordedFeatures).map(([k, v]: any) => (
                      <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800/60">
                        <span className="text-slate-500 text-[10px] block">{k}</span>
                        <span className="text-white font-bold">{Math.round(v * 100) / 100}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scoring Weights Distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-500" />
                <span>Feature Weight Distribution</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each normalized feature [0.0 - 1.0] contributes to the overall match score by its configured weight
              </p>
            </div>
            <button
              onClick={fetchConfig}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(weights).map(([key, value]: any) => {
              const pct = Math.round(value * 1000) / 10;
              return (
                <div key={key} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-200 capitalize">
                      {key.replace("Score", " Compatibility")}
                    </span>
                    <span className="font-mono font-bold text-rose-400">{pct}% ({value})</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-pink-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, pct * 3.5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
