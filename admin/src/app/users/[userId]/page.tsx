"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Shield,
  ShieldAlert,
  Sparkles,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Trash2,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Cigarette,
  Wine,
  Dog,
  Baby,
  Phone,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Clock,
  Receipt,
  AlertTriangle,
  Snowflake,
  MessageSquare,
  Flame,
  Zap,
  UserCheck,
  Download,
  UserCog,
  EyeOff,
  Smartphone,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function UserDetailPage() {
  const routeParams = useParams();
  const userId = (routeParams?.userId as string) || "";

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: profile | matches | chats | activity
  const [activeTab, setActiveTab] = useState<"profile" | "matches" | "chats" | "activity">("profile");

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Phase 5: GDPR Export & Impersonation states
  const [impersonationModalOpen, setImpersonationModalOpen] = useState(false);
  const [impersonationData, setImpersonationData] = useState<any>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Phase 6: Shadowban, Trust Score, & Hardware Ban states
  const [shadowbanModalOpen, setShadowbanModalOpen] = useState(false);
  const [shadowbanReason, setShadowbanReason] = useState("");
  const [trustScoreModalOpen, setTrustScoreModalOpen] = useState(false);
  const [trustScoreInput, setTrustScoreInput] = useState<number>(100);
  const [trustScoreReason, setTrustScoreReason] = useState("");
  const [deviceBanModalOpen, setDeviceBanModalOpen] = useState(false);
  const [deviceBanReason, setDeviceBanReason] = useState("");
  const [autoBanLinkedAccounts, setAutoBanLinkedAccounts] = useState(true);
  const [safetyMenuOpen, setSafetyMenuOpen] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUserProfile(userId);
      setUserData(res);
    } catch (err: any) {
      console.error("Failed to load user profile:", err);
      setError(err?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleBan = async () => {
    setActionLoading(true);
    try {
      await adminApi.banUser(userId, banReason);
      setBanModalOpen(false);
      setBanReason("");
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!confirm("Lift ban and restore full platform access for this account?")) return;
    setActionLoading(true);
    try {
      await adminApi.unbanUser(userId);
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to unban user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreeze = async () => {
    setActionLoading(true);
    try {
      await adminApi.freezeUser(userId, freezeReason);
      setFreezeModalOpen(false);
      setFreezeReason("");
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to freeze user account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!confirm("Unfreeze this account and restore normal platform access?")) return;
    setActionLoading(true);
    try {
      await adminApi.unfreezeUser(userId);
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to unfreeze account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVerification = async (currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const promptMsg = currentStatus
      ? "Revoke official Blue Badge verification for this profile?"
      : "Grant official Blue Badge verification to this profile?";
    if (!confirm(promptMsg)) return;

    setActionLoading(true);
    try {
      await adminApi.toggleVerification(userId, nextStatus);
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to update verification status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportGDPR = async () => {
    setExportLoading(true);
    try {
      const data = await adminApi.exportUserData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soulmate-gdpr-${userData?.user?.username || userId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || "Failed to export GDPR data archive");
    } finally {
      setExportLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!confirm(`Generate temporary simulation session token for @${userData?.user?.username || userId}?`)) return;
    setImpersonating(true);
    try {
      const res = await adminApi.impersonateUser(userId);
      setImpersonationData(res);
      setImpersonationModalOpen(true);
    } catch (err: any) {
      alert(err?.message || "Failed to initialize impersonation session");
    } finally {
      setImpersonating(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    if (!confirm("Permanently delete this photo from the user's profile for community guidelines violation?")) return;
    setActionLoading(true);
    try {
      await adminApi.deletePhoto(userId, photoUrl);
      if (activePhotoModal === photoUrl) setActivePhotoModal(null);
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to remove photo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleShadowban = async () => {
    setActionLoading(true);
    try {
      const willShadowban = !Boolean(userData?.user?.isShadowbanned);
      await adminApi.toggleShadowban(userId, willShadowban, shadowbanReason);
      setShadowbanModalOpen(false);
      setShadowbanReason("");
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to update shadowban status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTrustScore = async () => {
    setActionLoading(true);
    try {
      await adminApi.updateTrustScore(userId, trustScoreInput, trustScoreReason);
      setTrustScoreModalOpen(false);
      setTrustScoreReason("");
      fetchUser();
    } catch (err: any) {
      alert(err?.message || "Failed to update trust score");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanDevice = async () => {
    setActionLoading(true);
    try {
      await adminApi.banDevice({
        targetUserId: userId,
        reason: deviceBanReason || "Hardware banned for policy violation",
        autoBanAccounts: autoBanLinkedAccounts,
      });
      setDeviceBanModalOpen(false);
      setDeviceBanReason("");
      fetchUser();
      alert("Hardware device banned successfully.");
    } catch (err: any) {
      alert(err?.message || "Failed to ban device");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
        <Header title="User Profile Inspection" description="Loading profile records..." />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-3 text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span>Loading complete profile and account telemetry...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData?.user) {
    return (
      <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
        <Header title="User Profile Inspection" />
        <div className="p-8 max-w-4xl mx-auto w-full">
          <Link
            href="/users"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Users Directory
          </Link>
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">User Record Not Found</h2>
            <p className="text-xs text-rose-200/80 mb-6">{error || "The requested user account does not exist."}</p>
            <Link
              href="/users"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
            >
              Return to Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { user, profile, stats, reports = [], transactions = [], chats = [] } = userData;
  const isBanned = Boolean(user.banned);
  const isFrozen = Boolean(user.frozen);
  const isPremium = Boolean(user.isPremium);
  const isAdmin = Boolean(user.isAdmin);
  const isVerified = Boolean(profile?.verified);
  const matches = profile?.matches || [];
  const likes = profile?.likes || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title={`User: @${user.username}`}
        description={`Complete profile, match history, chats, activity telemetry, and moderation actions`}
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Redesigned Executive Action Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 px-3.5 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Identity Pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/users"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-slate-950/70 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Users</span>
            </Link>

            <span className="text-slate-700 text-xs font-light">/</span>

            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800/80 px-2.5 py-1 rounded-xl">
              <span className="font-bold text-white text-xs">@{user.username}</span>

              {/* Status Dot */}
              {isBanned ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Banned
                </span>
              ) : isFrozen ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 text-[10px] font-bold border border-sky-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Frozen
                </span>
              ) : Boolean(user.isShadowbanned) ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Shadowbanned
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}

              {/* Copy ID Button */}
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] font-mono transition-colors"
                title="Click to copy full User ID"
              >
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{userId.slice(0, 6)}...</span>
              </button>
            </div>
          </div>

          {/* Right: Cohesive Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
            {/* Trust Score Chip */}
            <button
              onClick={() => {
                setTrustScoreInput(user.trustScore ?? 100);
                setTrustScoreReason("");
                setTrustScoreModalOpen(true);
              }}
              disabled={actionLoading}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50 ${
                (user.trustScore ?? 100) >= 80
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40"
                  : (user.trustScore ?? 100) >= 50
                  ? "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/40"
                  : "bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40"
              }`}
              title="Calibrate Trust Score"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Trust: {user.trustScore ?? 100}</span>
            </button>

            {/* Verification Badge Toggle */}
            {isVerified ? (
              <button
                onClick={() => handleToggleVerification(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                title="Revoke Photo Verified Badge"
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Verified</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleVerification(false)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                title="Grant Photo Verified Blue Badge"
              >
                <BadgeCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Verify</span>
              </button>
            )}

            {/* Impersonate Simulation Button */}
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
              title="Preview App as this User (Read-Only Simulation)"
            >
              <UserCog className={`w-3.5 h-3.5 ${impersonating ? "animate-spin" : ""}`} />
              <span>Impersonate</span>
            </button>

            {/* Primary Ban / Lift Ban Button */}
            {isBanned ? (
              <button
                onClick={handleUnban}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lift Ban</span>
              </button>
            ) : (
              <button
                onClick={() => setBanModalOpen(true)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Ban Account</span>
              </button>
            )}

            {/* Safety & Moderation Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setSafetyMenuOpen(!safetyMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  safetyMenuOpen
                    ? "bg-slate-800 text-white border-slate-700"
                    : "bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Safety Actions</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${safetyMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Floating Menu Popover */}
              {safetyMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSafetyMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1">
                    {/* Freeze Option */}
                    <button
                      onClick={() => {
                        setSafetyMenuOpen(false);
                        if (isFrozen) {
                          handleUnfreeze();
                        } else {
                          setFreezeModalOpen(true);
                        }
                      }}
                      disabled={actionLoading || isBanned}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-xs text-slate-200 disabled:opacity-50"
                    >
                      <Snowflake className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          {isFrozen ? "Unfreeze Account" : "Freeze Account"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Suspend messaging & profile visibility
                        </div>
                      </div>
                    </button>

                    {/* Shadowban Option */}
                    <button
                      onClick={() => {
                        setSafetyMenuOpen(false);
                        setShadowbanReason("");
                        setShadowbanModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-xs text-slate-200 disabled:opacity-50"
                    >
                      <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">
                          {Boolean(user.isShadowbanned) ? "Lift Shadowban" : "Apply Shadowban"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Silently suppress from discovery feeds
                        </div>
                      </div>
                    </button>

                    {/* Hardware Ban Option */}
                    <button
                      onClick={() => {
                        setSafetyMenuOpen(false);
                        setDeviceBanReason("");
                        setDeviceBanModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-xs text-slate-200 disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Ban Hardware Device</div>
                        <div className="text-[10px] text-slate-400">
                          Block physical phone UUID & linked accounts
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-slate-800/80 my-1" />

                    {/* GDPR Data Export Option */}
                    <button
                      onClick={() => {
                        setSafetyMenuOpen(false);
                        handleExportGDPR();
                      }}
                      disabled={exportLoading}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors text-xs text-slate-200 disabled:opacity-50"
                    >
                      <Download className={`w-4 h-4 text-emerald-400 shrink-0 ${exportLoading ? "animate-bounce" : ""}`} />
                      <div>
                        <div className="font-semibold text-white">GDPR Data Export</div>
                        <div className="text-[10px] text-slate-400">
                          Download full JSON user data archive
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchUser}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Refresh User Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Hero Profile Header Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative shrink-0">
              {profile?.profileImage || profile?.photos?.[0] ? (
                <img
                  src={profile.profileImage || profile.photos[0]}
                  alt={user.username}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-700 shadow-md bg-slate-950"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 border border-rose-400/30 flex items-center justify-center font-bold text-3xl text-white shadow-md">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              {isVerified && (
                <div
                  className="absolute -bottom-2 -right-2 bg-sky-500 text-white p-1 rounded-full shadow-md border-2 border-slate-950"
                  title="Photo Verified Blue Badge"
                >
                  <BadgeCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {profile?.name || user.username}
                </h1>
                <span className="text-sm text-slate-400 font-mono">@{user.username}</span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {isAdmin && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold text-xs flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                  {isPremium ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold text-xs flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Premium
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                      Free Tier
                    </span>
                  )}
                  {isBanned ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-xs font-semibold flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Banned
                    </span>
                  ) : isFrozen ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-semibold flex items-center gap-1">
                      <Snowflake className="w-3 h-3" /> Frozen
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                  {Boolean(user.isShadowbanned) && (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-xs font-semibold flex items-center gap-1">
                      <EyeOff className="w-3 h-3 text-purple-400" /> Shadowbanned
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                      (user.trustScore ?? 100) >= 80
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800"
                        : (user.trustScore ?? 100) >= 50
                        ? "bg-amber-950/60 text-amber-400 border-amber-800"
                        : "bg-rose-950/60 text-rose-400 border-rose-800"
                    }`}
                  >
                    <ShieldAlert className="w-3 h-3" /> Trust: {user.trustScore ?? 100}/100
                  </span>
                  {user.emailVerified ? (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[11px] font-medium">
                      Email Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 text-[11px] font-medium">
                      Unverified Email
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {user.email}
                </span>
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Never"}
                </span>
                {user.deviceId && (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                    Device: {user.deviceId.slice(0, 12)}...
                  </span>
                )}
              </div>

              {isBanned && user.banReason && (
                <div className="mt-2 text-xs bg-rose-950/40 border border-rose-900/50 rounded-xl p-2.5 text-rose-300">
                  <span className="font-bold text-rose-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Ban Reason Recorded:
                  </span>
                  {user.banReason}
                </div>
              )}

              {isFrozen && user.frozenReason && (
                <div className="mt-2 text-xs bg-sky-950/40 border border-sky-900/50 rounded-xl p-2.5 text-sky-300">
                  <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Account Frozen Reason:
                  </span>
                  {user.frozenReason}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: "profile", label: "Profile & Discovery Card", icon: UserCheck },
            { id: "matches", label: `Match History (${matches.length})`, icon: Heart },
            { id: "chats", label: `Chat Conversations (${chats.length})`, icon: MessageSquare },
            { id: "activity", label: "Activity & Swipe Stats", icon: Flame },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFILE & DISCOVERY */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Photo Gallery */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Profile Photo Gallery</h3>
                    <p className="text-xs text-slate-400">
                      {profile?.photos?.length || 0} active photo(s) displayed on discovery cards
                    </p>
                  </div>
                  {profile?.verificationPhoto && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                      Live Pose Selfie Stored
                    </span>
                  )}
                </div>

                {profile?.photos && profile.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.photos.map((photo: string, index: number) => {
                      const isPrimary = photo === profile.profileImage || index === 0;
                      return (
                        <div
                          key={photo}
                          className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[3/4]"
                        >
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                            onClick={() => setActivePhotoModal(photo)}
                          />
                          {isPrimary && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                              Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              onClick={() => setActivePhotoModal(photo)}
                              className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700"
                              title="Inspect full image"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo)}
                              disabled={actionLoading}
                              className="p-2 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500"
                              title="Remove Photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No profile photos uploaded yet.
                  </div>
                )}

                {profile?.verificationPhoto && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    <img
                      src={profile.verificationPhoto}
                      alt="Pose Selfie"
                      className="w-16 h-16 rounded-lg object-cover border border-sky-500/40 cursor-pointer"
                      onClick={() => setActivePhotoModal(profile.verificationPhoto)}
                    />
                    <div className="text-xs space-y-1">
                      <span className="font-semibold text-sky-400 flex items-center gap-1 text-[11px]">
                        <BadgeCheck className="w-3.5 h-3.5" /> Submitted Pose Verification Selfie
                      </span>
                      <p className="text-slate-400 text-[11px]">
                        Compare against profile photos to verify physical identity authenticity.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* About Me & Bio */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white">About Me / Bio</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                  {profile?.aboutMe || "No written bio provided."}
                </p>
              </div>

              {/* Demographics & Core Profile Data */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Demographics & Vitals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Age & Gender
                    </span>
                    <span className="font-semibold text-white">
                      {profile?.age ? `${profile.age} years old` : "Age Unspecified"} •{" "}
                      <span className="capitalize">{profile?.gender || "Not specified"}</span>
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Seeking / Interested In
                    </span>
                    <span className="font-semibold text-rose-400 capitalize">
                      {profile?.interestedIn || "Everyone"}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" /> Profession
                    </span>
                    <span className="font-semibold text-slate-200">
                      {profile?.profession || "Not specified"}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-slate-400" /> Education
                    </span>
                    <span className="font-semibold text-slate-200">
                      {profile?.education || "Not specified"}
                    </span>
                  </div>

                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 sm:col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" /> Relationship Goals
                    </span>
                    <span className="font-semibold text-slate-200">
                      {profile?.relationshipGoals || "Not specified"}
                    </span>
                  </div>

                  {profile?.coordinates?.coordinates && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 sm:col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" /> GPS Coordinates
                        </span>
                        <span className="font-mono text-slate-300 text-[11px]">
                          [{profile.coordinates.coordinates[1]?.toFixed(4)},{" "}
                          {profile.coordinates.coordinates[0]?.toFixed(4)}]
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${profile.coordinates.coordinates[1]},${profile.coordinates.coordinates[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        <span>Open Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Icebreaker Prompts */}
              {profile?.prompts && profile.prompts.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">Icebreaker Prompts</h3>
                  <div className="space-y-3">
                    {profile.prompts.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-4 space-y-1.5"
                      >
                        <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
                          {p.question}
                        </span>
                        <p className="text-xs text-slate-200 font-medium italic">&ldquo;{p.answer}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Lifestyle, Discovery & Emergency */}
            <div className="lg:col-span-5 space-y-6">
              {/* Lifestyle */}
              {profile?.lifestyle && (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Lifestyle & Habits</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                        <Cigarette className="w-3 h-3 text-slate-500" /> Smoking
                      </span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {profile.lifestyle.smoking || "Unspecified"}
                      </span>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                        <Wine className="w-3 h-3 text-slate-500" /> Drinking
                      </span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {profile.lifestyle.drinking || "Unspecified"}
                      </span>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                        <Dog className="w-3 h-3 text-slate-500" /> Pets
                      </span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {profile.lifestyle.pets || "Unspecified"}
                      </span>
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                        <Baby className="w-3 h-3 text-slate-500" /> Children
                      </span>
                      <span className="font-semibold text-slate-200 capitalize">
                        {profile.lifestyle.wantsChildren || "Unspecified"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Discovery Filters */}
              {profile?.preferences && (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Discovery Preferences</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Target Age Range</span>
                      <span className="font-semibold text-white">
                        {profile.preferences.minAge || 18} - {profile.preferences.maxAge || 99} yrs
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                      <span className="text-slate-400">Max Distance</span>
                      <span className="font-semibold text-white">
                        {profile.preferences.maxDistanceKm ? `${profile.preferences.maxDistanceKm} km` : "No limit"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Dealbreakers</span>
                      <span className="font-semibold text-rose-400 text-right">
                        {profile.preferences.dealbreakers?.length > 0
                          ? profile.preferences.dealbreakers.join(", ")
                          : "None"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Emergency Contacts</span>
                </h3>
                {user.emergencyContacts && user.emergencyContacts.length > 0 ? (
                  <div className="space-y-2">
                    {user.emergencyContacts.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-white">{c.name}</span>
                        <a href={`tel:${c.phone}`} className="font-mono text-emerald-400 hover:text-emerald-300">
                          {c.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    No emergency contacts registered.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATCH HISTORY */}
        {activeTab === "matches" && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Mutual Match Pairs</h3>
                  <p className="text-xs text-slate-400">
                    Active dating matches formed with @{user.username}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-xs">
                  {matches.length} Total Matches
                </span>
              </div>

              {matches.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <Heart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>No mutual matches recorded for this account.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((m: any) => {
                    const matchedUser = m.user;
                    return (
                      <div
                        key={m._id}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {m.profileImage || m.photos?.[0] ? (
                            <img
                              src={m.profileImage || m.photos[0]}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                              {m.name?.charAt(0) || "?"}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white text-xs flex items-center gap-1">
                              <span>{m.name || "Dater"}</span>
                              {m.verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {m.age ? `${m.age} yrs` : "Age N/A"} • {m.location || "Location unset"}
                            </div>
                            {matchedUser && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                @{matchedUser.username}
                              </div>
                            )}
                          </div>
                        </div>

                        {matchedUser && (
                          <Link
                            href={`/users/${matchedUser._id}`}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Inspect Partner Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Likes Sent */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1">Likes Sent by User</h3>
              <p className="text-xs text-slate-400 mb-4">
                Profiles swiped right by @{user.username} ({likes.length} recorded)
              </p>

              {likes.length === 0 ? (
                <p className="text-xs text-slate-500">No outgoing swipe records.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  {likes.slice(0, 12).map((l: any) => (
                    <div
                      key={l._id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-center text-xs"
                    >
                      {l.profileImage || l.photos?.[0] ? (
                        <img
                          src={l.profileImage || l.photos[0]}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover mx-auto mb-1.5 bg-slate-900 border border-slate-800"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 mx-auto mb-1.5 flex items-center justify-center font-bold text-slate-400">
                          {l.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className="font-semibold text-white truncate text-[11px]">{l.name || "User"}</div>
                      <div className="text-[10px] text-slate-500">{l.location || "Nearby"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CHAT CONVERSATIONS */}
        {activeTab === "chats" && (
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Chat Conversations</h3>
                <p className="text-xs text-slate-400">
                  All active communication channels involving @{user.username}
                </p>
              </div>
              <Link
                href="/chat"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>Open Chat Moderation</span>
              </Link>
            </div>

            {chats.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <span>No message threads found for this user.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((c: any) => {
                  const partner = c.otherParticipant;
                  const partnerProfile = c.otherProfile;
                  const lastMsg = c.lastMessage;

                  return (
                    <div
                      key={c._id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {partnerProfile?.profileImage ? (
                          <img
                            src={partnerProfile.profileImage}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                            {partner?.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white text-xs flex items-center gap-2">
                            <span>{partnerProfile?.name || partner?.username || "Match"}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              @{partner?.username}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-md">
                            {lastMsg?.content ? (
                              <span>&ldquo;{lastMsg.content}&rdquo;</span>
                            ) : (
                              <span className="italic text-slate-500">No text messages exchanged yet</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}
                        </span>
                        <Link
                          href={`/chat?chatId=${c._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-rose-400 font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>Inspect Thread</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACTIVITY & SWIPE STATS */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            {/* KPI Telemetry Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Mutual Matches
                </span>
                <div className="text-xl font-bold text-white">{stats?.matchesCount ?? 0}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Likes Sent
                </span>
                <div className="text-xl font-bold text-white">{stats?.likesCount ?? 0}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Super Likes
                </span>
                <div className="text-xl font-bold text-amber-400">{stats?.superLikesCount ?? 0}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Passes
                </span>
                <div className="text-xl font-bold text-slate-400">{stats?.passesCount ?? 0}</div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Total Spent
                </span>
                <div className="text-xl font-bold text-emerald-400">
                  NPR {Number(stats?.totalSpent || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Safety Reports
                </span>
                <div className={`text-xl font-bold ${stats?.reportsCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
                  {stats?.reportsCount ?? 0}
                </div>
              </div>
            </div>

            {/* Daily Swipes & Boost Status Card */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Daily Swipe Limits & Boost Telemetry</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Likes Used Today</span>
                  <div className="text-lg font-bold text-white">{stats?.likesUsedToday || 0}</div>
                  <span className="text-[10px] text-slate-500">Resets every 24 hours</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Super Likes Used Today</span>
                  <div className="text-lg font-bold text-amber-400">{stats?.superLikesUsedToday || 0}</div>
                  <span className="text-[10px] text-slate-500">Daily premium allocation</span>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Profile Boost Status</span>
                  <div className="text-sm font-bold text-rose-400">
                    {stats?.boostedUntil && new Date(stats.boostedUntil) > new Date()
                      ? `Active until ${new Date(stats.boostedUntil).toLocaleTimeString()}`
                      : "Inactive"}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {stats?.lastBoostActivatedAt
                      ? `Last boosted: ${new Date(stats.lastBoostActivatedAt).toLocaleDateString()}`
                      : "No boosts activated recently"}
                  </span>
                </div>
              </div>
            </div>

            {/* Reports & Financial Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Reports Filed Against User</span>
                  </h3>
                  <Link
                    href={`/reports?search=${encodeURIComponent(user.username)}`}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    View All
                  </Link>
                </div>

                {reports.length > 0 ? (
                  <div className="space-y-2.5">
                    {reports.map((r: any) => (
                      <div
                        key={r._id}
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              r.status === "open"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {r.status}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] font-medium">{r.reason}</p>
                        <div className="text-[10px] text-slate-500">
                          Reporter: @{r.reporter?.username || "Anonymous"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    Clean safety record — no community violations recorded.
                  </p>
                )}
              </div>

              {/* Financial Transactions */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Transactions Ledger</span>
                  </h3>
                  <Link
                    href={`/transactions?search=${encodeURIComponent(user.email)}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    All Transactions
                  </Link>
                </div>

                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((t: any) => (
                      <div
                        key={t._id}
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white uppercase text-[11px]">
                            {t.provider} • {t.productId || "Subscription"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">NPR {t.amount}</div>
                          <span
                            className={`text-[9px] font-bold uppercase ${
                              t.status === "completed" ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    No transactions recorded for this account.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {banModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ban @{user.username}</h3>
                  <p className="text-xs text-slate-400">
                    Immediately revoke session & block app access.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Ban Reason (Logged in Audit Trail)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Terms violation, inappropriate conduct, fake profile..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setBanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBan}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20"
                >
                  {actionLoading ? "Banning..." : "Confirm Account Ban"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Freeze User Modal */}
        {freezeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Snowflake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Emergency Freeze @{user.username}</h3>
                  <p className="text-xs text-slate-400">
                    Suspends matching, swipes, and real-time chat without applying a permanent ban.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Freeze Reason / Administrative Note
                </label>
                <textarea
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="e.g. Identity verification pending, suspicious login activity..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setFreezeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFreeze}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-lg shadow-sky-600/20"
                >
                  {actionLoading ? "Freezing..." : "Confirm Account Freeze"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Lightbox Modal */}
        {activePhotoModal && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActivePhotoModal(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh] w-full flex items-center justify-center">
              <img
                src={activePhotoModal}
                alt="Enlarged photo"
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

        {/* Impersonation & Simulation Session Modal */}
        {impersonationModalOpen && impersonationData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    <UserCog className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Active Simulation Session</h3>
                    <p className="text-xs text-slate-400">
                      Scoped read-only JWT generated for @{impersonationData.user?.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setImpersonationModalOpen(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {/* User Snapshot */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                  {impersonationData.profile?.profileImage ? (
                    <img
                      src={impersonationData.profile.profileImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      {impersonationData.user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {impersonationData.profile?.name || impersonationData.user?.username}
                    </span>
                    {impersonationData.profile?.verified && (
                      <BadgeCheck className="w-4 h-4 text-sky-400" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {impersonationData.user?.email} • {impersonationData.expiresIn}
                  </p>
                </div>
              </div>

              {/* Scoped Bearer Token */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Bearer Simulation Token (Header: Authorization Bearer &lt;token&gt;)
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={impersonationData.impersonationToken}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 select-all focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(impersonationData.impersonationToken);
                      setCopiedToken(true);
                      setTimeout(() => setCopiedToken(false), 2000);
                    }}
                    className="absolute right-2.5 top-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold flex items-center gap-1 shadow-md"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This token allows inspecting the mobile app frontend or Postman API as this user with read-only simulation guarantees. All actions are audited.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setImpersonationModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Close Session Viewer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shadowban Modal */}
        {shadowbanModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {Boolean(user.isShadowbanned) ? "Lift Shadowban" : "Apply Algorithmic Shadowban"}
                  </h3>
                  <p className="text-xs text-slate-400">Target: @{user.username}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs leading-relaxed">
                {Boolean(user.isShadowbanned)
                  ? "Lifting the shadowban will restore this user's visibility in normal matching candidate pools."
                  : "Shadowbanned users can still open the app and swipe, but their profile will never be shown to any other active daters. No notification is sent to them."}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Internal Operational Reason
                </label>
                <textarea
                  value={shadowbanReason}
                  onChange={(e) => setShadowbanReason(e.target.value)}
                  placeholder="e.g. Suspected spammer, multiple user complaints, low engagement bait..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShadowbanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleShadowban}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {actionLoading
                    ? "Updating..."
                    : Boolean(user.isShadowbanned)
                    ? "Restore Visibility"
                    : "Confirm Shadowban"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trust Score Calibration Modal */}
        {trustScoreModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Calibrate Trust Score</h3>
                  <p className="text-xs text-slate-400">User: @{user.username}</p>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Trust Rating</span>
                  <span
                    className={`font-mono font-bold text-sm px-2 py-0.5 rounded-md ${
                      trustScoreInput >= 80
                        ? "text-emerald-400 bg-emerald-950/60"
                        : trustScoreInput >= 50
                        ? "text-amber-400 bg-amber-950/60"
                        : "text-rose-400 bg-rose-950/60"
                    }`}
                  >
                    {trustScoreInput} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={trustScoreInput}
                  onChange={(e) => setTrustScoreInput(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">
                  Scores below 50 flag accounts for safety review. Scores below 25 automatically trigger an algorithmic shadowban.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Adjustment Reason (Logged in Audit Trail)
                </label>
                <input
                  type="text"
                  value={trustScoreReason}
                  onChange={(e) => setTrustScoreReason(e.target.value)}
                  placeholder="e.g. False report resolution, verified in-person, repeated warnings..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTrustScoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTrustScore}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Score"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hardware Device Blacklist Modal */}
        {deviceBanModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Blacklist Hardware Device</h3>
                  <p className="text-xs text-slate-400">Target Account: @{user.username}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs leading-relaxed">
                Blacklisting prevents this physical phone or device fingerprint from creating or logging into any accounts on the platform.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Blacklist Reason (Required)
                </label>
                <textarea
                  value={deviceBanReason}
                  onChange={(e) => setDeviceBanReason(e.target.value)}
                  placeholder="e.g. Predator/harassment ban evasion, multi-account romance scam, bot network..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={autoBanLinkedAccounts}
                  onChange={(e) => setAutoBanLinkedAccounts(e.target.checked)}
                  className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                />
                <span>Auto-ban all other accounts associated with this hardware</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeviceBanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanDevice}
                  disabled={actionLoading || !deviceBanReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {actionLoading ? "Blacklisting..." : "Confirm Hardware Ban"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
