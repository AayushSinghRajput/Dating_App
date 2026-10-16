"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function ModerationQueuePage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [rejectModalFlag, setRejectModalFlag] = useState<any>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simUserId, setSimUserId] = useState("");
  const [simPhotoUrl, setSimPhotoUrl] = useState("");
  const [simFlagType, setSimFlagType] = useState("nsfw");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getModerationFlags(statusFilter, search, page);
      setFlags(res.flags || []);
      setTotal(res.total || 0);
      setPendingCount(res.pendingCount || 0);
    } catch (err: any) {
      console.error("Failed to load moderation flags:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchFlags();
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await adminApi.actionModerationFlag(id, "approve", "Approved by human moderator");
      fetchFlags();
    } catch (err: any) {
      alert(err?.message || "Failed to approve photo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalFlag) return;
    setActionLoading(true);
    try {
      await adminApi.actionModerationFlag(rejectModalFlag._id, "reject", rejectNotes);
      setRejectModalFlag(null);
      setRejectNotes("");
      fetchFlags();
    } catch (err: any) {
      alert(err?.message || "Failed to reject photo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simUserId || !simPhotoUrl) return;
    setActionLoading(true);
    try {
      await adminApi.createPhotoFlag(simUserId, simPhotoUrl, simFlagType, 90, "Simulated AI vision flag");
      setSimulateModalOpen(false);
      setSimUserId("");
      setSimPhotoUrl("");
      fetchFlags();
    } catch (err: any) {
      alert(err?.message || "Failed to simulate flag");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="AI Photo & NSFW Moderation Queue"
        description="Review AI-detected adult content, inappropriate imagery, and user safety flags with one-click quarantine actions"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Triage
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
              <span className="text-[11px] text-slate-500">Photos awaiting human verification</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Flagged Photos
              </span>
              <div className="text-2xl font-bold text-white mt-1">{total}</div>
              <span className="text-[11px] text-slate-500">Historical AI detections</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                AI Vision Detection
              </span>
              <div className="text-sm font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Cloudinary Webhook Active
              </div>
              <span className="text-[11px] text-slate-500">Automated photo quarantine enabled</span>
            </div>
            <button
              onClick={() => setSimulateModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Simulate Flag</span>
            </button>
          </div>
        </div>

        {/* Controls, Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </form>

            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {[
                { key: "pending", label: `Pending (${pendingCount})` },
                { key: "approved", label: "Approved Safe" },
                { key: "rejected", label: "Violations Purged" },
                { key: "all", label: "All History" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === tab.key
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={fetchFlags}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Photo Grid / Cards */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span>Loading photo moderation queue...</span>
          </div>
        ) : flags.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
            <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto mb-3" />
            <span className="font-bold text-slate-300 text-sm block">Moderation Queue Clear!</span>
            <span className="text-xs text-slate-500">
              No photos currently awaiting moderation in this view.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {flags.map((flag) => {
              const user = flag.user;
              const profile = flag.profile;

              return (
                <div
                  key={flag._id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-slate-700 transition-colors"
                >
                  {/* Photo with Overlay */}
                  <div className="relative aspect-[3/4] bg-slate-950 overflow-hidden">
                    <img
                      src={flag.photoUrl}
                      alt="Flagged image"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setActivePhotoModal(flag.photoUrl)}
                    />

                    {/* Flag Type Pill */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-bold text-[10px] uppercase tracking-wider shadow">
                        {flag.flagType} ({flag.confidenceScore}%)
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      {flag.status === "pending" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-black font-bold text-[10px] uppercase shadow">
                          Pending
                        </span>
                      )}
                      {flag.status === "approved" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold text-[10px] uppercase shadow">
                          Safe
                        </span>
                      )}
                      {flag.status === "rejected" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px] uppercase shadow">
                          Purged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Details & Actions */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/users/${user?._id}`}
                          className="font-bold text-white hover:text-rose-400 transition-colors flex items-center gap-1"
                        >
                          <span>{profile?.name || user?.username || "Unknown"}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {new Date(flag.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        @{user?.username || "user"}
                      </span>

                      {flag.reviewNotes && (
                        <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2">
                          &ldquo;{flag.reviewNotes}&rdquo;
                        </p>
                      )}
                    </div>

                    {flag.status === "pending" ? (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleApprove(flag._id)}
                          disabled={actionLoading}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Safe</span>
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalFlag(flag);
                            setRejectNotes("");
                          }}
                          disabled={actionLoading}
                          className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 text-right pt-2 border-t border-slate-800/80">
                        Reviewed by @{flag.reviewedBy?.username || "Admin"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 rounded-xl">
          <span>
            Showing {flags.length > 0 ? (page - 1) * 20 + 1 : 0} to{" "}
            {Math.min(page * 20, total)} of {total} flagged photos
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Reject & Purge Modal */}
      {rejectModalFlag && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <Trash2 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Purge Inappropriate Photo</h3>
                <p className="text-xs text-slate-400">Permanently removes image from profile cards</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Moderation Violation Note</label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g. Explicit content, community guideline violation, copyright infringement..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalFlag(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20"
              >
                Confirm & Purge Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={activePhotoModal}
              alt=""
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Simulate Flag Modal */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSimulate}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Queue Simulated NSFW Photo</h3>
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">User ID</label>
                <input
                  type="text"
                  required
                  value={simUserId}
                  onChange={(e) => setSimUserId(e.target.value)}
                  placeholder="e.g. 64f123..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Photo URL</label>
                <input
                  type="text"
                  required
                  value={simPhotoUrl}
                  onChange={(e) => setSimPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Detection Type</label>
                <select
                  value={simFlagType}
                  onChange={(e) => setSimFlagType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="nsfw">NSFW Adult Content</option>
                  <option value="spam">Commercial Spam</option>
                  <option value="hate">Hate Symbol</option>
                  <option value="violence">Violence</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Queue Photo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
