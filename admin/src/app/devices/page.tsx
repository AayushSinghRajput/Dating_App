"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone,
  ShieldAlert,
  Search,
  RefreshCw,
  Plus,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Ban,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function DevicesPage() {
  const [activeTab, setActiveTab] = useState<"blacklist" | "clusters">("blacklist");

  // Blacklist states
  const [devices, setDevices] = useState<any[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Clusters state
  const [clusters, setClusters] = useState<any[]>([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  // Modal states
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDeviceId, setBanDeviceId] = useState("");
  const [banFingerprint, setBanFingerprint] = useState("");
  const [banIp, setBanIp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [autoBanLinked, setAutoBanLinked] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchBlacklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBannedDevices(page, search);
      setDevices(res.devices || []);
      setTotalDevices(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load banned devices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchClusters = useCallback(async () => {
    setClustersLoading(true);
    try {
      const res = await adminApi.getDeviceClusters();
      setClusters(res.clusters || []);
    } catch (err: any) {
      console.error("Failed to load device clusters:", err);
    } finally {
      setClustersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "blacklist") {
      fetchBlacklist();
    } else {
      fetchClusters();
    }
  }, [activeTab, fetchBlacklist, fetchClusters]);

  const handleCreateBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReason.trim()) {
      alert("Please enter a reason for the hardware blacklist");
      return;
    }
    if (!banDeviceId && !banFingerprint && !banIp) {
      alert("Please provide at least a Device ID, Hardware Fingerprint, or IP Address");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.banDevice({
        deviceId: banDeviceId.trim() || undefined,
        hardwareFingerprint: banFingerprint.trim() || undefined,
        ipAddress: banIp.trim() || undefined,
        reason: banReason.trim(),
        autoBanAccounts: autoBanLinked,
      });
      setBanModalOpen(false);
      setBanDeviceId("");
      setBanFingerprint("");
      setBanIp("");
      setBanReason("");
      fetchBlacklist();
    } catch (err: any) {
      alert(err?.message || "Failed to ban device");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnban = async (id: string, label: string) => {
    if (!confirm(`Remove "${label}" from hardware blacklist?`)) return;
    try {
      await adminApi.unbanDevice(id);
      fetchBlacklist();
    } catch (err: any) {
      alert(err?.message || "Failed to remove hardware ban");
    }
  };

  const handleClusterQuickBan = async (cluster: any) => {
    const confirmMsg = `Hardware-ban Device "${cluster.clusterKey}" and ban all ${cluster.accountCount} associated account(s)?`;
    if (!confirm(confirmMsg)) return;

    try {
      await adminApi.banDevice({
        deviceId: cluster.clusterKey,
        reason: "Multi-account catfish/bot cluster ban",
        autoBanAccounts: true,
      });
      fetchClusters();
      alert("Cluster and associated accounts banned successfully.");
    } catch (err: any) {
      alert(err?.message || "Failed to ban cluster");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Hardware & Device Bans"
        description="Enforce hardware-level UUID bans to prevent ban evasion and hunt multi-account bot/catfish networks"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Navigation Tabs & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab("blacklist")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "blacklist"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Banned Hardware ({totalDevices})</span>
            </button>
            <button
              onClick={() => setActiveTab("clusters")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === "clusters"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Account Clusters ({clusters.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => (activeTab === "blacklist" ? fetchBlacklist() : fetchClusters())}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading || clustersLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            {activeTab === "blacklist" && (
              <button
                onClick={() => setBanModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Ban Hardware</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: BLACKLIST TABLE */}
        {activeTab === "blacklist" && (
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by Device UUID, Fingerprint, IP, or reason..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {loading ? (
              <div className="py-24 text-center text-slate-500 text-sm">
                Fetching banned hardware entries...
              </div>
            ) : devices.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No Banned Devices</h3>
                <p className="text-xs text-slate-500 mt-1">
                  No hardware identifiers or IP addresses are currently blacklisted.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Hardware Identifier</th>
                        <th className="py-3 px-4">Blacklist Reason</th>
                        <th className="py-3 px-4">Linked Accounts</th>
                        <th className="py-3 px-4">Banned By</th>
                        <th className="py-3 px-4">Date Added</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {devices.map((d) => {
                        const label = d.deviceId || d.hardwareFingerprint || d.ipAddress || "Unknown";
                        return (
                          <tr key={d._id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-slate-200">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-rose-500 shrink-0" />
                                <div>
                                  <div className="font-bold text-white text-xs">{label}</div>
                                  {d.ipAddress && d.deviceId && (
                                    <div className="text-[11px] text-slate-500">IP: {d.ipAddress}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                              {d.reason}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
                                {d.associatedAccounts?.length || 0} account(s)
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              @{d.bannedBy?.username || "Admin"}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleUnban(d._id, label)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-semibold transition-colors"
                              >
                                Lift Ban
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {Math.ceil(totalDevices / 20) > 1 && (
                  <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Page {page} of {Math.ceil(totalDevices / 20)}
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
                        disabled={page >= Math.ceil(totalDevices / 20)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MULTI-ACCOUNT CLUSTERS */}
        {activeTab === "clusters" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">
                  Bot & Catfish Ring Detection
                </span>
                The algorithms group user accounts sharing the exact same physical device UUID or hardware fingerprint. Clusters with multiple accounts are often bot operators or romance scammers.
              </div>
            </div>

            {clustersLoading ? (
              <div className="py-24 text-center text-slate-500 text-sm">
                Scanning accounts for hardware clusters...
              </div>
            ) : clusters.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No Suspicious Clusters Detected</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every active account appears to belong to a unique physical device.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clusters.map((c) => (
                  <div
                    key={c.clusterKey}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-rose-500" />
                          <span className="font-mono text-xs font-bold text-white">
                            {c.clusterKey}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{c.accountCount} Accounts</span>
                          <span>•</span>
                          <span>Avg Trust: {c.avgTrustScore}/100</span>
                        </div>
                      </div>

                      {c.isBlacklisted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-[11px] font-bold">
                          Hardware Blacklisted
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClusterQuickBan(c)}
                          className="px-3 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-md shadow-rose-600/20"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Ban All Accounts</span>
                        </button>
                      )}
                    </div>

                    {/* Linked Accounts Pills */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Linked Dating Profiles:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {c.accounts?.map((acc: any) => (
                          <div
                            key={acc._id}
                            className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              {acc.profile?.profileImage ? (
                                <img
                                  src={acc.profile.profileImage}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-slate-800"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-white">
                                  {acc.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-white flex items-center gap-1.5">
                                  <span>{acc.profile?.name || acc.username}</span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    @{acc.username}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  Trust: {acc.trustScore ?? 100} • Joined{" "}
                                  {new Date(acc.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {acc.banned && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 text-[10px] font-bold">
                                  Banned
                                </span>
                              )}
                              <Link
                                href={`/users/${acc._id}`}
                                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Hardware Ban Modal */}
        {banModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Hardware Blacklist</h3>
                  <p className="text-xs text-slate-400">
                    Enforce device-level bans across all connected accounts
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateBan} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Device UUID / Hardware Key
                  </label>
                  <input
                    type="text"
                    value={banDeviceId}
                    onChange={(e) => setBanDeviceId(e.target.value)}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    IP Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={banIp}
                    onChange={(e) => setBanIp(e.target.value)}
                    placeholder="e.g. 192.168.1.1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Blacklist Reason (Required)
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    required
                    rows={2}
                    placeholder="e.g. Repeated scamming, harassment, multiple account ban evasion..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={autoBanLinked}
                    onChange={(e) => setAutoBanLinked(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <span>Automatically ban all existing accounts tied to this device</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBanModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 disabled:opacity-50"
                  >
                    {submitting ? "Blacklisting..." : "Confirm Blacklist"}
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
