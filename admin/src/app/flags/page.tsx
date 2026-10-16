"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Plus,
  Trash2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Crown,
  Percent,
  Layers,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  minimumAppVersion: string;
  targetTiers: string[];
  createdAt: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [rolloutPercentage, setRolloutPercentage] = useState<number>(100);
  const [minimumAppVersion, setMinimumAppVersion] = useState("1.0.0");
  const [targetTiers, setTargetTiers] = useState<string[]>(["free", "premium"]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFeatureFlags();
      setFlags(res.flags || []);
    } catch (err: any) {
      console.error("Failed to load flags:", err);
      setNotification({ type: "error", text: "Failed to load feature flags" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.updateFeatureFlag(id, { enabled: !currentStatus });
      setFlags((prev) =>
        prev.map((f) => (f._id === id ? { ...f, enabled: !currentStatus } : f))
      );
      setNotification({ type: "success", text: "Flag state updated." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update flag" });
    }
  };

  const handleRolloutChange = async (id: string, newRollout: number) => {
    try {
      await adminApi.updateFeatureFlag(id, { rolloutPercentage: newRollout });
      setFlags((prev) =>
        prev.map((f) => (f._id === id ? { ...f, rolloutPercentage: newRollout } : f))
      );
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update rollout %" });
    }
  };

  const handleDelete = async (id: string, flagKey: string) => {
    if (!confirm(`Delete feature flag "${flagKey}"?`)) return;

    try {
      await adminApi.deleteFeatureFlag(id);
      setFlags((prev) => prev.filter((f) => f._id !== id));
      setNotification({ type: "success", text: "Feature flag deleted." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete flag" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !name) return;

    setFormLoading(true);
    try {
      await adminApi.createFeatureFlag({
        key,
        name,
        description,
        enabled,
        rolloutPercentage,
        minimumAppVersion,
        targetTiers,
      });

      setNotification({ type: "success", text: "Feature flag created!" });
      setShowCreateModal(false);
      setKey("");
      setName("");
      setDescription("");
      fetchFlags();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to create flag" });
    } finally {
      setFormLoading(false);
    }
  };

  const activeCount = flags.filter((f) => f.enabled).length;
  const canaryCount = flags.filter((f) => f.enabled && f.rolloutPercentage < 100).length;
  const vipOnlyCount = flags.filter(
    (f) => f.targetTiers.includes("premium") && !f.targetTiers.includes("free")
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Dynamic Feature Flag Engine"
        description="Toggle app features without app store approvals, manage canary percentage rollouts, and gate VIP-exclusive capabilities."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Toast */}
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
                Total Flags
              </span>
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {flags.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Configured in platform switchboard</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Active in Production
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {activeCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Currently serving mobile devices</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Canary Staged Rollouts
              </span>
              <Percent className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2">
              {canaryCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active with &lt; 100% cohort ratio</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                VIP Exclusive
              </span>
              <Crown className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
              {vipOnlyCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Gated to premium subscribers</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-500" />
            <span>Platform Flags & Toggles</span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFlags}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Feature Flag</span>
            </button>
          </div>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading feature flags...
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag) => (
              <div
                key={flag._id}
                className={`bg-slate-900/80 border rounded-2xl p-5 sm:p-6 transition-all ${
                  flag.enabled ? "border-slate-800 shadow-md" : "border-slate-800/40 opacity-60"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Info */}
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{flag.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-rose-300">
                        {flag.key}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                        min v{flag.minimumAppVersion}
                      </span>
                      {flag.targetTiers.length === 1 && flag.targetTiers[0] === "premium" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          <span>VIP Only</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {flag.description || "No description provided."}
                    </p>

                    {/* Rollout Slider */}
                    <div className="flex items-center gap-3 pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Rollout Cohort:
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={flag.rolloutPercentage}
                        onChange={(e) => handleRolloutChange(flag._id, parseInt(e.target.value, 10))}
                        className="w-32 accent-rose-500 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-white w-10">
                        {flag.rolloutPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleToggle(flag._id, flag.enabled)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        flag.enabled
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {flag.enabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-500" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(flag._id, flag.key)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Feature Flag"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Flag Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sliders className="w-4 h-4 text-rose-500" />
                  <span>Create Feature Flag</span>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Flag Key (Identifier)
                    </label>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="e.g. voice_notes"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Audio Voice Notes"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Description & Purpose
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief explanation of the feature and rollout criteria..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Initial Rollout %
                    </label>
                    <input
                      type="number"
                      value={rolloutPercentage}
                      onChange={(e) => setRolloutPercentage(parseInt(e.target.value, 10) || 0)}
                      min="0"
                      max="100"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Min App Version
                    </label>
                    <input
                      type="text"
                      value={minimumAppVersion}
                      onChange={(e) => setMinimumAppVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Target User Tiers
                  </label>
                  <select
                    value={targetTiers.length === 1 && targetTiers[0] === "premium" ? "premium" : "all"}
                    onChange={(e) => setTargetTiers(e.target.value === "premium" ? ["premium"] : ["free", "premium"])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Daters (Free & Premium)</option>
                    <option value="premium">VIP Subscribers Only</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enabledCheck"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <label htmlFor="enabledCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Enable immediately
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20"
                  >
                    {formLoading ? "Creating..." : "Create Flag"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
