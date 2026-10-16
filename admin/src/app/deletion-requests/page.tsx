"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  UserX,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [approveModalReq, setApproveModalReq] = useState<any>(null);
  const [rejectModalReq, setRejectModalReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDeletionRequests(statusFilter, search, page);
      setRequests(res.requests || []);
      setTotal(res.total || 0);
      setPendingCount(res.pendingCount || 0);
    } catch (err: any) {
      console.error("Failed to load deletion requests:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const handleApprove = async () => {
    if (!approveModalReq) return;
    setActionLoading(true);
    try {
      await adminApi.approveDeletionRequest(approveModalReq._id);
      setApproveModalReq(null);
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to approve deletion request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalReq) return;
    setActionLoading(true);
    try {
      await adminApi.rejectDeletionRequest(rejectModalReq._id, rejectReason);
      setRejectModalReq(null);
      setRejectReason("");
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to reject deletion request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTestRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserId.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.createDeletionRequest(createUserId.trim(), createReason);
      setCreateModalOpen(false);
      setCreateUserId("");
      setCreateReason("");
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || "Failed to create deletion request");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Account Deletion Request Queue"
        description="GDPR & privacy compliance: review, approve data purges, or reject user account deletion requests"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Pending Actions
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
              <span className="text-[11px] text-slate-500">Requires review & GDPR decision</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Total Requests
              </span>
              <div className="text-2xl font-bold text-white mt-1">{total}</div>
              <span className="text-[11px] text-slate-500">All submitted deletion inquiries</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Queue Status
              </span>
              <div className="text-sm font-bold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> System Compliant
              </div>
              <span className="text-[11px] text-slate-500">30-day GDPR window enforced</span>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Simulate Request</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </form>

            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: `Pending (${pendingCount})` },
                { key: "approved", label: "Approved (Purged)" },
                { key: "rejected", label: "Rejected" },
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
            onClick={fetchRequests}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Requests Table */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Resolution Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                        <span>Loading deletion requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500/50" />
                        <span className="font-medium text-slate-300">Queue is clear!</span>
                        <span className="text-xs text-slate-500">
                          {statusFilter === "pending"
                            ? "No pending deletion requests awaiting moderation."
                            : "No records found matching current filters."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const user = req.user;
                    const profile = req.profile;
                    return (
                      <tr key={req._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {profile?.profileImage || profile?.photos?.[0] ? (
                              <img
                                src={profile.profileImage || profile.photos[0]}
                                alt=""
                                className="w-9 h-9 rounded-xl object-cover bg-slate-950 border border-slate-800"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                                {user?.username?.charAt(0).toUpperCase() || "?"}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                <span>{profile?.name || user?.username || "Purged Account"}</span>
                                {user && (
                                  <Link
                                    href={`/users/${user._id}`}
                                    className="text-slate-500 hover:text-rose-400 transition-colors"
                                    title="View User Detail"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {user ? `@${user.username} · ${user.email}` : "User record purged"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-300 truncate" title={req.reason}>
                            {req.reason || "Account closure requested"}
                          </p>
                          {req.rejectionReason && (
                            <span className="text-[10px] text-rose-400 block mt-0.5">
                              Rejection note: {req.rejectionReason}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                          <div>{new Date(req.createdAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.status === "pending" && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {req.status === "approved" && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Approved & Purged
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 w-fit">
                              <XCircle className="w-3 h-3" /> Rejected
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {req.resolvedAt ? (
                            <div>
                              <span>By @{req.resolvedBy?.username || "Admin"}</span>
                              <div className="text-[10px] text-slate-500">
                                {new Date(req.resolvedAt).toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {req.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setApproveModalReq(req)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-sm"
                                title="Approve & Purge all user data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Purge</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalReq(req);
                                  setRejectReason("");
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Archived</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60">
            <span>
              Showing {requests.length > 0 ? (page - 1) * 20 + 1 : 0} to{" "}
              {Math.min(page * 20, total)} of {total} requests
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
        </div>
      </main>

      {/* Approve & Purge Modal */}
      {approveModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Permanent Account Purge</h3>
                <p className="text-xs text-slate-400">GDPR Right to Erasure Enforcement</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Account:</span>
                <span className="font-semibold text-white">@{approveModalReq.user?.username || "N/A"}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Email:</span>
                <span className="text-slate-400">{approveModalReq.user?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Reason:</span>
                <span className="text-slate-400 truncate max-w-[200px]">{approveModalReq.reason}</span>
              </div>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs text-rose-300 space-y-1">
              <p className="font-semibold">⚠️ Irreversible Action:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-400">
                <li>User profile and discovery cards will be deleted.</li>
                <li>Chat messages and match pairs will be cleared.</li>
                <li>Authentication credentials will be permanently erased.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Purge Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Reject Deletion Request</h3>
            <p className="text-xs text-slate-400">
              State the reason why this deletion request cannot be honored (e.g., active legal dispute or fraudulent request).
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason provided to the applicant..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Reject Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulate/Create Deletion Request Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateTestRequest}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Queue Deletion Request</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Submit a deletion request on behalf of a user or simulate an incoming GDPR erasure ticket.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">User ID (MongoDB ObjectId)</label>
                <input
                  type="text"
                  required
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  placeholder="e.g. 64f123a4b..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Reason for Deletion</label>
                <textarea
                  value={createReason}
                  onChange={(e) => setCreateReason(e.target.value)}
                  placeholder="e.g. User submitted request via mobile app settings"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Queue Request</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
