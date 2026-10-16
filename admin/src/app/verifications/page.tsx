"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Camera,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  ExternalLink,
  ZoomIn,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface ImagePreview {
  url: string;
  title: string;
  subtitle?: string;
  type?: "selfie" | "profile";
}

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "verified" | "unverified"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ImagePreview | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getVerifications(filter, search, page);
      setVerifications(res.verifications || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error("Failed to load verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [filter, page]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };
    if (previewImage) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [previewImage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVerifications();
  };

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    const confirmMsg =
      action === "approve"
        ? "Approve verification and grant the official Blue Badge to this profile?"
        : "Reject verification and remove the selfie submission?";
    if (!confirm(confirmMsg)) return;

    setActionInProgress(userId);
    try {
      await adminApi.setVerificationAction(userId, action);
      fetchVerifications();
    } catch (err: any) {
      alert(err?.message || "Failed to update verification status");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Photo Verification Desk"
        description="Verify user-submitted pose selfies against their active dating profile photos"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Controls, Search & Filter Pills */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, user or email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
              {["all", "unverified", "verified"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors whitespace-nowrap ${
                    filter === f
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f === "unverified" ? "Pending Review" : f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Submissions: <span className="text-white font-bold">{total}</span>
            </span>
            <button
              onClick={fetchVerifications}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Verification Submissions Grid */}
        {loading ? (
          <div className="py-24 text-center text-slate-500 text-sm">
            Fetching verification submissions...
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400">
            <BadgeCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Submissions Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no photo verification requests under the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {verifications.map((item) => {
              const u = item.user || {};
              const isWorking = actionInProgress === u._id;
              const primaryProfilePhoto = item.profileImage || item.photos?.[0];
              const additionalPhotos = (item.photos || []).filter(
                (p: string) => p && p !== primaryProfilePhoto
              );

              return (
                <div
                  key={item._id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-5"
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-white">
                          {item.name || u.username || "Anonymous Dater"}
                        </span>
                        {item.verified ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                        {u._id && (
                          <Link
                            href={`/users/${u._id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 ml-1 transition-colors"
                            title="Inspect full user profile"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Side by side comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Verification Selfie */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-rose-400 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submitted Pose Selfie</span>
                        </div>
                        {item.verificationPhoto && (
                          <span className="text-[10px] text-slate-500 font-normal">Click to zoom</span>
                        )}
                      </div>
                      <div
                        onClick={() => {
                          if (item.verificationPhoto) {
                            setPreviewImage({
                              url: item.verificationPhoto,
                              title: `${item.name || u.username || "User"}'s Submitted Pose Selfie`,
                              subtitle: "Submitted live pose selfie for identity verification",
                              type: "selfie",
                            });
                          }
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border-2 border-rose-500/40 bg-slate-950 relative group ${
                          item.verificationPhoto ? "cursor-pointer hover:border-rose-400 transition-all" : ""
                        }`}
                      >
                        {item.verificationPhoto ? (
                          <>
                            <img
                              src={item.verificationPhoto}
                              alt="Verification Selfie"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-xs text-white font-medium backdrop-blur-[2px]">
                              <ZoomIn className="w-5 h-5 text-rose-400" />
                              <span>View Full Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                            No Selfie
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Primary Profile Image */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-400 mb-2">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>Profile Picture</span>
                        </div>
                        {primaryProfilePhoto && (
                          <span className="text-[10px] text-slate-500 font-normal">Click to zoom</span>
                        )}
                      </div>
                      <div
                        onClick={() => {
                          if (primaryProfilePhoto) {
                            setPreviewImage({
                              url: primaryProfilePhoto,
                              title: `${item.name || u.username || "User"}'s Primary Profile Photo`,
                              subtitle: "Main dating profile display image",
                              type: "profile",
                            });
                          }
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group ${
                          primaryProfilePhoto ? "cursor-pointer hover:border-sky-400 transition-all" : ""
                        }`}
                      >
                        {primaryProfilePhoto ? (
                          <>
                            <img
                              src={primaryProfilePhoto}
                              alt="Profile Photo"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-xs text-white font-medium backdrop-blur-[2px]">
                              <ZoomIn className="w-5 h-5 text-sky-400" />
                              <span>View Full Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                            No Photo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Profile Photos strip if available */}
                  {additionalPhotos.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          Other Profile Photos ({additionalPhotos.length}):
                        </span>
                        <span className="text-[10px] text-slate-500">Click any to inspect</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {additionalPhotos.map((pUrl: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: pUrl,
                                title: `${item.name || u.username || "User"}'s Profile Photo #${idx + 2}`,
                                subtitle: `Additional dating profile photo ${idx + 2} of ${(item.photos || []).length}`,
                                type: "profile",
                              })
                            }
                            className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-800 hover:border-rose-400 transition-all flex-shrink-0 group"
                          >
                            <img
                              src={pUrl}
                              alt={`Photo ${idx + 2}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleAction(u._id, "reject")}
                      disabled={isWorking}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/60 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{item.verified ? "Revoke Badge" : "Reject Selfie"}</span>
                    </button>

                    {!item.verified && (
                      <button
                        onClick={() => handleAction(u._id, "approve")}
                        disabled={isWorking}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white shadow-lg shadow-sky-600/20 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isWorking ? "Processing..." : "Approve Blue Badge"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="px-6 py-3.5 rounded-xl border border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="text-xs text-slate-400">
              Page {page} of {Math.max(1, Math.ceil(total / 20))} ({total} total submissions)
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
                disabled={page * 20 >= total}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Full Image Inspection Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    previewImage.type === "selfie"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  }`}
                >
                  {previewImage.type === "selfie" ? (
                    <Camera className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    {previewImage.title}
                  </h3>
                  {previewImage.subtitle && (
                    <p className="text-[11px] text-slate-400">
                      {previewImage.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Open original in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-3 sm:p-6 min-h-[320px]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl select-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">Click outside or press Esc to close</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
