"use client";

import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Info,
  AlertTriangle,
  Flame,
  Wrench,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "promo" | "maintenance";
  targetSegment: string;
  ctaText?: string;
  ctaLink?: string;
  active: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdBy?: {
    username: string;
    email: string;
  };
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "promo" | "maintenance">("info");
  const [targetSegment, setTargetSegment] = useState("all");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [priority, setPriority] = useState<number>(1);
  const [active, setActive] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (err: any) {
      console.error("Failed to load announcements:", err);
      setNotification({ type: "error", text: "Failed to load announcements" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setFormLoading(true);
    try {
      await adminApi.createAnnouncement({
        title,
        message,
        type,
        targetSegment,
        ctaText: ctaText || undefined,
        ctaLink: ctaLink || undefined,
        priority,
        active,
      });

      setNotification({ type: "success", text: "In-app banner created successfully!" });
      setShowCreateModal(false);
      setTitle("");
      setMessage("");
      setCtaText("");
      setCtaLink("");
      fetchAnnouncements();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to create banner" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.updateAnnouncement(id, { active: !currentStatus });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, active: !currentStatus } : a))
      );
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to toggle status" });
    }
  };

  const handleDelete = async (id: string, bannerTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete banner "${bannerTitle}"?`)) return;

    try {
      await adminApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      setNotification({ type: "success", text: "Banner deleted." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete announcement" });
    }
  };

  const activeCount = announcements.filter((a) => a.active).length;
  const promoCount = announcements.filter((a) => a.type === "promo").length;
  const maintenanceCount = announcements.filter((a) => a.type === "maintenance").length;

  const getTypeStyle = (t: string) => {
    switch (t) {
      case "promo":
        return {
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          accent: "from-rose-600/30 to-pink-600/20",
        };
      case "warning":
        return {
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          accent: "from-amber-600/30 to-yellow-600/20",
        };
      case "maintenance":
        return {
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          icon: <Wrench className="w-3.5 h-3.5 text-purple-400" />,
          accent: "from-purple-600/30 to-indigo-600/20",
        };
      default:
        return {
          badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
          icon: <Info className="w-3.5 h-3.5 text-sky-400" />,
          accent: "from-sky-600/30 to-blue-600/20",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="In-App Announcement Manager"
        description="Publish live sticky alert banners, server maintenance warnings, and promotional campaigns directly to user home dashboards."
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
                Total Banners
              </span>
              <Megaphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {announcements.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Configured in registry</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Active Banners
              </span>
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {activeCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Currently showing in mobile app</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Promotional Offers
              </span>
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2">
              {promoCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Discounts & VIP upsells</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Maintenance Alerts
              </span>
              <Wrench className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-2">
              {maintenanceCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Scheduled server notices</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-rose-500" />
            <span>Active Announcements & Broadcast Banners</span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnnouncements}
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
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Announcements Configured</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create an announcement to broadcast alerts to mobile users.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((item) => {
              const style = getTypeStyle(item.type);
              return (
                <div
                  key={item._id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 sm:p-6 transition-all ${
                    item.active ? "border-slate-800 shadow-md" : "border-slate-800/40 opacity-70"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                        {style.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}
                          >
                            {item.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-semibold">
                            Priority: {item.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-semibold uppercase">
                            Segment: {item.targetSegment}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                          {item.message}
                        </p>

                        {item.ctaText && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-2">
                            <span>Button Action: &ldquo;{item.ctaText}&rdquo;</span>
                            {item.ctaLink && (
                              <span className="text-slate-500 font-mono text-[11px]">
                                ({item.ctaLink})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleActive(item._id, item.active)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          item.active
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        {item.active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                            <span>Live in App</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(item._id, item.title)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  <span>Create In-App Announcement</span>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Banner Type
                    </label>
                    <select
                      value={type}
                      onChange={(e: any) => setType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="info">Information (Blue)</option>
                      <option value="promo">Promotional / Sale (Pink)</option>
                      <option value="warning">System Warning (Amber)</option>
                      <option value="maintenance">Scheduled Maintenance (Purple)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Target Segment
                    </label>
                    <select
                      value={targetSegment}
                      onChange={(e) => setTargetSegment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="all">All App Users</option>
                      <option value="free">Free Tier Only</option>
                      <option value="premium">VIP Subscribers Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. ⚡ Weekend SuperLike Flash Sale (50% Off)"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Message Body
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Upgrade to VIP Plus before Sunday midnight to get 10 free SuperLikes and unlimited rewinds."
                    rows={3}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Button CTA Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Claim 50% Off"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Target Link / Route
                    </label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="e.g. /screen/Subscriptions"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Priority Order
                    </label>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value, 10) || 1)}
                      min="1"
                      max="100"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="activeCheck"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <label htmlFor="activeCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Publish immediately upon creation
                    </label>
                  </div>
                </div>

                {/* Mockup Preview */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>In-App Mobile Sticky Preview</span>
                  </div>
                  <div
                    className={`rounded-xl p-3.5 border bg-gradient-to-r ${getTypeStyle(type).accent} border-slate-700/60 flex items-center justify-between gap-3`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {title || "Announcement Headline"}
                      </div>
                      <div className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                        {message || "Message details will show here on user dashboard."}
                      </div>
                    </div>
                    {ctaText && (
                      <span className="px-3 py-1 rounded-lg bg-white text-slate-950 text-xs font-bold shrink-0">
                        {ctaText}
                      </span>
                    )}
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
                    {formLoading ? "Publishing..." : "Publish Banner"}
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
