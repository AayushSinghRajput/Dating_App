"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Code,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface Campaign {
  _id: string;
  subject: string;
  previewText: string;
  contentHtml: string;
  targetSegment: string;
  recipientCount: number;
  status: "draft" | "sent" | "scheduled";
  sentAt?: string;
  createdAt: string;
  createdBy?: {
    username: string;
    email: string;
  };
}

const TEMPLATE_PRESETS = [
  {
    name: "🔥 Weekend Love Flash Sale (VIP 50% Off)",
    subject: "🔥 This Weekend Only: 50% Off Soulmate VIP Plus",
    previewText: "Unlock unlimited likes, rewinds, and see who liked your profile.",
    segment: "free_users",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #f43f5e; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SOULMATE</h1>
    <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Find your spark this weekend</p>
  </div>
  <div style="background: linear-gradient(135deg, rgba(244,63,94,0.15), rgba(236,72,153,0.1)); border: 1px solid rgba(244,63,94,0.3); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <h2 style="font-size: 22px; color: #ffffff; margin: 0 0 8px 0;">⚡ Flash Sale: 50% Off Premium</h2>
    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin: 0;">Upgrade now and see who has already liked you. Send priority SuperLikes that put you at the top of their deck.</p>
    <div style="margin-top: 20px;">
      <a href="https://soulmate.app/upgrade" style="background: linear-gradient(to right, #e11d48, #ec4899); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-block;">Claim 50% Off VIP</a>
    </div>
  </div>
  <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">Offer ends Sunday at 11:59 PM. Terms apply.</p>
</div>`,
  },
  {
    name: "👋 Win-Back: Someone Liked You While You Were Away",
    subject: "👀 Someone liked your profile while you were away...",
    previewText: "Don't leave them waiting! Open Soulmate to see your new matches.",
    segment: "inactive",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #f43f5e; font-size: 28px; margin: 0; font-weight: 800;">SOULMATE</h1>
  </div>
  <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 12px;">We missed you! ✨</h2>
  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    While you've been away, singles in your area have been active! You have new admirers waiting to connect with you.
  </p>
  <div style="text-align: center; margin: 28px 0;">
    <a href="https://soulmate.app" style="background: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-block;">Open Soulmate App</a>
  </div>
  <p style="color: #64748b; font-size: 12px; text-align: center;">You received this email because you have a Soulmate account.</p>
</div>`,
  },
  {
    name: "🔒 Safety: Get Verified with a Blue Badge",
    subject: "🌟 3x More Matches with a Verified Blue Badge",
    previewText: "Verified profiles get prioritized in discovery and receive 300% more likes.",
    segment: "unverified",
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #38bdf8; font-size: 28px; margin: 0; font-weight: 800;">SOULMATE TRUST</h1>
  </div>
  <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 12px;">Get Your Blue Checkmark in 60 Seconds 🛡️</h2>
  <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
    Daters are 3x more likely to match with verified profiles. Snap a quick selfie pose to confirm your identity and get instant priority ranking.
  </p>
  <div style="text-align: center; margin: 28px 0;">
    <a href="https://soulmate.app/verify" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-block;">Get Verified Now</a>
  </div>
</div>`,
  },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [targetSegment, setTargetSegment] = useState("all");
  const [contentHtml, setContentHtml] = useState(TEMPLATE_PRESETS[0].html);
  const [viewTab, setViewTab] = useState<"code" | "preview">("preview");
  const [formLoading, setFormLoading] = useState(false);

  // Preview Drawer
  const [previewModalCampaign, setPreviewModalCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmailCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (err: any) {
      console.error("Failed to load campaigns:", err);
      setNotification({ type: "error", text: "Failed to load email campaigns" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleApplyPreset = (preset: (typeof TEMPLATE_PRESETS)[0]) => {
    setSubject(preset.subject);
    setPreviewText(preset.previewText);
    setTargetSegment(preset.segment);
    setContentHtml(preset.html);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !contentHtml) return;

    setFormLoading(true);
    try {
      await adminApi.createEmailCampaign({
        subject,
        previewText,
        targetSegment,
        contentHtml,
      });
      setNotification({ type: "success", text: "Email campaign drafted successfully!" });
      setShowModal(false);
      fetchCampaigns();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to create campaign" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSend = async (campaign: Campaign) => {
    if (
      !confirm(
        `Are you sure you want to SEND campaign "${campaign.subject}" to target segment "${campaign.targetSegment.toUpperCase()}"? This action will queue emails immediately.`
      )
    ) {
      return;
    }

    setSendingId(campaign._id);
    try {
      const res = await adminApi.sendEmailCampaign(campaign._id);
      setNotification({ type: "success", text: res.message || "Campaign transmitted!" });
      fetchCampaigns();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to transmit campaign" });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete campaign "${title}"?`)) return;

    try {
      await adminApi.deleteEmailCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      setNotification({ type: "success", text: "Campaign deleted." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete campaign" });
    }
  };

  const totalSent = campaigns.filter((c) => c.status === "sent").length;
  const totalEmailsDispatched = campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Email Campaign Manager"
        description="Design re-engagement win-back drips, VIP discount announcements, and safety broadcasts with live responsive HTML previews."
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
              <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                Total Campaigns
              </span>
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {campaigns.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Drafts and delivered runs</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Emails Dispatched
              </span>
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
              {totalEmailsDispatched.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Delivered to dater inboxes</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Completed Blasts
              </span>
              <CheckCircle className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-2 font-mono">
              {totalSent}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active transmission cycles</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Drafts in Queue
              </span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 font-mono">
              {campaigns.length - totalSent}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for review or dispatch</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-rose-500" />
            <span>Campaign Registry & Transmissions</span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => {
                handleApplyPreset(TEMPLATE_PRESETS[0]);
                setShowModal(true);
              }}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Campaign</span>
            </button>
          </div>
        </div>

        {/* Campaign List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-2xl">
            <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Email Campaigns Created</h3>
            <p className="text-xs text-slate-400 mt-1">
              Start by drafting your first marketing blast or re-engagement drip.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Subject & Preheader</th>
                    <th className="px-6 py-3.5 font-semibold">Target Audience</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold">Recipients</th>
                    <th className="px-6 py-3.5 font-semibold">Created By</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-bold text-white text-xs">{c.subject}</div>
                        {c.previewText && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {c.previewText}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] uppercase">
                          {c.targetSegment}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {c.status === "sent" ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sent ({new Date(c.sentAt || c.createdAt).toLocaleDateString()})</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300">
                        {c.recipientCount > 0 ? `${c.recipientCount.toLocaleString()} users` : "—"}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        {c.createdBy?.username || "Admin"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewModalCampaign(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Preview Email HTML"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {c.status === "draft" && (
                            <button
                              onClick={() => handleSend(c)}
                              disabled={sendingId === c._id}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                              title="Send to Target Segment Now"
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingId === c._id ? "Sending..." : "Send"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(c._id, c.subject)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compose Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Mail className="w-4 h-4 text-rose-500" />
                  <span>Compose Email Campaign</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Template Presets Bar */}
              <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Quick Presets:
                </span>
                {TEMPLATE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium shrink-0 transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. 50% Off Soulmate VIP Plus This Weekend Only"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
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
                      <option value="all">All Members</option>
                      <option value="free_users">Free Tier Users (Upsell)</option>
                      <option value="inactive">Inactive 60d+ (Win-back)</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Preheader / Preview Snippet
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Short text shown next to subject line in Gmail/Apple Mail inbox"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Editor Tabs (Code vs Live HTML Preview) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Email Template Body
                    </label>
                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setViewTab("code")}
                        className={`px-2.5 py-1 rounded font-semibold text-[10px] flex items-center gap-1 ${
                          viewTab === "code"
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>HTML Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewTab("preview")}
                        className={`px-2.5 py-1 rounded font-semibold text-[10px] flex items-center gap-1 ${
                          viewTab === "preview"
                            ? "bg-slate-800 text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Preview</span>
                      </button>
                    </div>
                  </div>

                  {viewTab === "code" ? (
                    <textarea
                      value={contentHtml}
                      onChange={(e) => setContentHtml(e.target.value)}
                      rows={12}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-rose-500 leading-relaxed"
                    />
                  ) : (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[280px] max-h-[360px] overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20"
                  >
                    {formLoading ? "Saving Draft..." : "Save Campaign Draft"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Read-Only Campaign Preview Drawer / Modal */}
        {previewModalCampaign && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {previewModalCampaign.subject}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Segment: {previewModalCampaign.targetSegment} • Status: {previewModalCampaign.status}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewModalCampaign(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-950">
                <div dangerouslySetInnerHTML={{ __html: previewModalCampaign.contentHtml }} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
