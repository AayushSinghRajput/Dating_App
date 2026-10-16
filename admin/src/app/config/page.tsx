"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  CheckCircle,
  Flame,
  Clock,
  Compass,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function AppConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [freeDailySwipeLimit, setFreeDailySwipeLimit] = useState(50);
  const [premiumDailySwipeLimit, setPremiumDailySwipeLimit] = useState(9999);
  const [freeSuperLikesPerWeek, setFreeSuperLikesPerWeek] = useState(1);
  const [boostDurationMinutes, setBoostDurationMinutes] = useState(30);
  const [defaultDiscoveryRadiusKm, setDefaultDiscoveryRadiusKm] = useState(50);
  const [maxDiscoveryRadiusKm, setMaxDiscoveryRadiusKm] = useState(150);
  const [matchExpirationDays, setMatchExpirationDays] = useState(14);
  const [chatAudioNotesMaxSeconds, setChatAudioNotesMaxSeconds] = useState(60);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceNotice, setMaintenanceNotice] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAppConfig();
      const cfg = res.config || {};
      setFreeDailySwipeLimit(cfg.freeDailySwipeLimit ?? 50);
      setPremiumDailySwipeLimit(cfg.premiumDailySwipeLimit ?? 9999);
      setFreeSuperLikesPerWeek(cfg.freeSuperLikesPerWeek ?? 1);
      setBoostDurationMinutes(cfg.boostDurationMinutes ?? 30);
      setDefaultDiscoveryRadiusKm(cfg.defaultDiscoveryRadiusKm ?? 50);
      setMaxDiscoveryRadiusKm(cfg.maxDiscoveryRadiusKm ?? 150);
      setMatchExpirationDays(cfg.matchExpirationDays ?? 14);
      setChatAudioNotesMaxSeconds(cfg.chatAudioNotesMaxSeconds ?? 60);
      setMaintenanceMode(cfg.maintenanceMode ?? false);
      setMaintenanceNotice(cfg.maintenanceNotice || "We are upgrading Soulmate servers. Back online shortly!");
    } catch (err: any) {
      console.error("Failed to load app config:", err);
      setNotification({ type: "error", text: "Failed to load global configuration" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await adminApi.updateAppConfig({
        freeDailySwipeLimit: Number(freeDailySwipeLimit),
        premiumDailySwipeLimit: Number(premiumDailySwipeLimit),
        freeSuperLikesPerWeek: Number(freeSuperLikesPerWeek),
        boostDurationMinutes: Number(boostDurationMinutes),
        defaultDiscoveryRadiusKm: Number(defaultDiscoveryRadiusKm),
        maxDiscoveryRadiusKm: Number(maxDiscoveryRadiusKm),
        matchExpirationDays: Number(matchExpirationDays),
        chatAudioNotesMaxSeconds: Number(chatAudioNotesMaxSeconds),
        maintenanceMode,
        maintenanceNotice,
      });

      setNotification({ type: "success", text: "Global dating app parameters updated successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update configuration" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="App Configuration & Global Dating Limits"
        description="Fine-tune daily swipe caps, match expiration timelines, geo-discovery radius limits, and emergency maintenance status."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-5xl w-full mx-auto">
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

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading configuration parameters...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Maintenance Mode Alert Box */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                maintenanceMode
                  ? "bg-rose-950/40 border-rose-600/60 shadow-xl shadow-rose-950/30"
                  : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl ${
                      maintenanceMode ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Emergency Server Maintenance Mode</h3>
                    <p className="text-xs text-slate-400">
                      When enabled, user app logins will be temporarily paused with your custom notice banner.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {maintenanceMode && (
                <div className="mt-3 pt-3 border-t border-rose-900/40">
                  <label className="block text-[11px] font-semibold text-rose-300 mb-1 uppercase tracking-wider">
                    Dater Notification Banner Text
                  </label>
                  <input
                    type="text"
                    value={maintenanceNotice}
                    onChange={(e) => setMaintenanceNotice(e.target.value)}
                    className="w-full bg-slate-950 border border-rose-800/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Daily Swiping & Quotas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Swipe Deck Limits & Allocation Quotas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Free Daily Swipe Cap
                  </label>
                  <input
                    type="number"
                    value={freeDailySwipeLimit}
                    onChange={(e) => setFreeDailySwipeLimit(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Free users quota per 24 hours</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    VIP Daily Swipe Limit
                  </label>
                  <input
                    type="number"
                    value={premiumDailySwipeLimit}
                    onChange={(e) => setPremiumDailySwipeLimit(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">9999 represents unlimited swiping</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Free Weekly SuperLikes
                  </label>
                  <input
                    type="number"
                    value={freeSuperLikesPerWeek}
                    onChange={(e) => setFreeSuperLikesPerWeek(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Granted weekly on Sunday reset</p>
                </div>
              </div>
            </div>

            {/* Discovery & Geography Radius */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Geographic Discovery & Matching Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Default Discovery Radius (KM)
                  </label>
                  <input
                    type="number"
                    value={defaultDiscoveryRadiusKm}
                    onChange={(e) => setDefaultDiscoveryRadiusKm(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Initial search distance for new signups</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Max Expandable Radius (KM)
                  </label>
                  <input
                    type="number"
                    value={maxDiscoveryRadiusKm}
                    onChange={(e) => setMaxDiscoveryRadiusKm(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Maximum slider boundary in settings</p>
                </div>
              </div>
            </div>

            {/* Media & Duration Parameters */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800/80 pb-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Media Duration & Lifecycle Timers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Boost Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={boostDurationMinutes}
                    onChange={(e) => setBoostDurationMinutes(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Multiplier time for 10x visibility</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Chat Voice Note Cap (Seconds)
                  </label>
                  <input
                    type="number"
                    value={chatAudioNotesMaxSeconds}
                    onChange={(e) => setChatAudioNotesMaxSeconds(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Maximum length per recorded audio clip</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Match Dormancy Expiration (Days)
                  </label>
                  <input
                    type="number"
                    value={matchExpirationDays}
                    onChange={(e) => setMatchExpirationDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Days before an unanswered match expires</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="py-3 px-8 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Parameters...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Global Configuration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
