const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "An error occurred", response.status);
  }

  return data;
}

export const adminApi = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data?.message || "Login failed", res.status);
    const isAdmin = Boolean(data?.user?.isAdmin ?? data?.isAdmin);
    if (!isAdmin) {
      throw new ApiError("Access Denied: This account does not have admin privileges.", 403);
    }
    if (!data.user) {
      data.user = {
        id: data._id,
        username: data.username,
        email: data.email,
        isAdmin: true,
      };
    }
    return data;
  },

  getMe: () => fetchWithAuth("/api/admin/me"),

  // Analytics (Phase 3)
  getAnalytics: () => fetchWithAuth("/api/admin/analytics"),
  getRevenueAnalytics: () => fetchWithAuth("/api/admin/analytics/revenue"),
  getCohortAnalytics: () => fetchWithAuth("/api/admin/analytics/cohorts"),
  getFunnelAnalytics: () => fetchWithAuth("/api/admin/analytics/funnel"),
  getGeoAnalytics: () => fetchWithAuth("/api/admin/analytics/geo"),
  getMatchQualityMetrics: () => fetchWithAuth("/api/admin/analytics/match-quality"),
  getSwipeFatigueTracker: () => fetchWithAuth("/api/admin/analytics/swipe-fatigue"),

  // Users
  getUsers: (search = "", page = 1, status = "all") => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "all") params.append("status", status);
    params.append("page", page.toString());
    return fetchWithAuth(`/api/admin/users?${params.toString()}`);
  },

  getUserProfile: (userId: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/profile`),

  banUser: (userId: string, reason?: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  unbanUser: (userId: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/unban`, {
      method: "POST",
    }),

  deletePhoto: (userId: string, url: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/photo`, {
      method: "DELETE",
      body: JSON.stringify({ url }),
    }),

  // Reports
  getReports: (status = "open", search = "", page = 1) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", page.toString());
    return fetchWithAuth(`/api/admin/reports?${params.toString()}`);
  },

  resolveReport: (reportId: string, action: "dismiss" | "ban", reason?: string) =>
    fetchWithAuth(`/api/admin/reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  // Verifications
  getVerifications: (status = "all", search = "", page = 1) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", page.toString());
    return fetchWithAuth(`/api/admin/verifications?${params.toString()}`);
  },

  setVerificationAction: (userId: string, action: "approve" | "reject", reason?: string) =>
    fetchWithAuth(`/api/admin/verifications/${userId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  // Transactions
  getTransactions: (provider = "", status = "", search = "", page = 1) => {
    const params = new URLSearchParams();
    if (provider) params.append("provider", provider);
    if (status) params.append("status", status);
    if (search) params.append("search", search);
    params.append("page", page.toString());
    return fetchWithAuth(`/api/admin/transactions?${params.toString()}`);
  },

  // Broadcasts
  sendBroadcast: (data: { title: string; body: string; target: string; customData?: any; filters?: any }) =>
    fetchWithAuth("/api/admin/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBroadcasts: (page = 1) => fetchWithAuth(`/api/admin/broadcasts?page=${page}`),

  // Audit Logs
  getAuditLogs: (action = "", search = "", page = 1) => {
    const params = new URLSearchParams();
    if (action) params.append("action", action);
    if (search) params.append("search", search);
    params.append("page", page.toString());
    return fetchWithAuth(`/api/admin/audit-logs?${params.toString()}`);
  },

  // Algorithm & Recommendation
  getAlgorithmConfig: () => fetchWithAuth("/api/admin/algorithm"),

  explainMatch: (viewerId: string, targetUserId: string) =>
    fetchWithAuth("/api/admin/algorithm/explain", {
      method: "POST",
      body: JSON.stringify({ viewerId, targetUserId }),
    }),

  // System Health
  getSystemHealth: () => fetchWithAuth("/api/admin/health"),

  // Phase 1 — Chat Moderation
  getChats: (page = 1) => fetchWithAuth(`/api/admin/chats?page=${page}`),
  getMessages: (params: { search?: string; chatId?: string; type?: string; page?: number }) => {
    const p = new URLSearchParams();
    if (params.search) p.append("search", params.search);
    if (params.chatId) p.append("chatId", params.chatId);
    if (params.type) p.append("type", params.type);
    p.append("page", (params.page || 1).toString());
    return fetchWithAuth(`/api/admin/messages?${p.toString()}`);
  },
  deleteMessage: (messageId: string) =>
    fetchWithAuth(`/api/admin/messages/${messageId}`, { method: "DELETE" }),

  // Phase 1 — Freeze / Unfreeze
  freezeUser: (userId: string, reason?: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/freeze`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
  unfreezeUser: (userId: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/unfreeze`, { method: "PATCH" }),

  // Phase 1 — Subscription Management
  getSubscriptions: (status = "all", search = "", page = 1) => {
    const p = new URLSearchParams();
    if (status && status !== "all") p.append("status", status);
    if (search) p.append("search", search);
    p.append("page", page.toString());
    return fetchWithAuth(`/api/admin/subscriptions?${p.toString()}`);
  },
  updateSubscription: (userId: string, action: "extend" | "revoke", days?: number) =>
    fetchWithAuth(`/api/admin/subscriptions/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, days }),
    }),

  // Phase 1 — Refund Management
  updateRefund: (transactionId: string, refundStatus: string, refundNote?: string) =>
    fetchWithAuth(`/api/admin/transactions/${transactionId}/refund`, {
      method: "PATCH",
      body: JSON.stringify({ refundStatus, refundNote }),
    }),

  // Phase 1 — Support Tickets
  getTickets: (params: { status?: string; priority?: string; category?: string; search?: string; page?: number }) => {
    const p = new URLSearchParams();
    if (params.status) p.append("status", params.status);
    if (params.priority) p.append("priority", params.priority);
    if (params.category) p.append("category", params.category);
    if (params.search) p.append("search", params.search);
    p.append("page", (params.page || 1).toString());
    return fetchWithAuth(`/api/admin/tickets?${p.toString()}`);
  },
  getTicketStats: () => fetchWithAuth("/api/admin/tickets/stats"),
  getTicket: (ticketId: string) => fetchWithAuth(`/api/admin/tickets/${ticketId}`),
  replyToTicket: (ticketId: string, body: string, status?: string) =>
    fetchWithAuth(`/api/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      body: JSON.stringify({ body, status }),
    }),
  updateTicket: (ticketId: string, data: { status?: string; priority?: string; assignedTo?: string }) =>
    fetchWithAuth(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Phase 2 — Verified Badge Toggle
  toggleVerification: (userId: string, verified: boolean) =>
    fetchWithAuth(`/api/admin/users/${userId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    }),

  // Phase 2 — Bulk User Actions
  bulkUserAction: (userIds: string[], action: string, reason?: string) =>
    fetchWithAuth("/api/admin/users/bulk", {
      method: "POST",
      body: JSON.stringify({ userIds, action, reason }),
    }),

  // Phase 2 — Inactive Users
  getInactiveUsersStats: () => fetchWithAuth("/api/admin/users/inactive/stats"),
  remindInactiveUsers: (days = 60, title?: string, message?: string) =>
    fetchWithAuth("/api/admin/users/inactive/remind", {
      method: "POST",
      body: JSON.stringify({ days, title, message }),
    }),

  // Phase 2 — Deletion Request Queue
  getDeletionRequests: (status = "all", search = "", page = 1) => {
    const p = new URLSearchParams();
    if (status && status !== "all") p.append("status", status);
    if (search) p.append("search", search);
    p.append("page", page.toString());
    return fetchWithAuth(`/api/admin/deletion-requests?${p.toString()}`);
  },
  approveDeletionRequest: (id: string) =>
    fetchWithAuth(`/api/admin/deletion-requests/${id}/approve`, { method: "POST" }),
  rejectDeletionRequest: (id: string, reason: string) =>
    fetchWithAuth(`/api/admin/deletion-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  createDeletionRequest: (userId: string, reason?: string) =>
    fetchWithAuth("/api/admin/deletion-requests", {
      method: "POST",
      body: JSON.stringify({ userId, reason }),
    }),

  // Phase 4 — Photo Moderation Queue
  getModerationFlags: (status = "all", search = "", page = 1) => {
    const p = new URLSearchParams();
    if (status && status !== "all") p.append("status", status);
    if (search) p.append("search", search);
    p.append("page", page.toString());
    return fetchWithAuth(`/api/admin/moderation/photos?${p.toString()}`);
  },
  actionModerationFlag: (id: string, action: "approve" | "reject", notes?: string) =>
    fetchWithAuth(`/api/admin/moderation/photos/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    }),
  createPhotoFlag: (userId: string, photoUrl: string, flagType = "nsfw", confidenceScore = 85, reviewNotes?: string) =>
    fetchWithAuth("/api/admin/moderation/photos", {
      method: "POST",
      body: JSON.stringify({ userId, photoUrl, flagType, confidenceScore, reviewNotes }),
    }),

  // Phase 4 — Keyword Blocklist Manager
  getBlocklist: (category = "all", search = "", page = 1) => {
    const p = new URLSearchParams();
    if (category && category !== "all") p.append("category", category);
    if (search) p.append("search", search);
    p.append("page", page.toString());
    return fetchWithAuth(`/api/admin/blocklist?${p.toString()}`);
  },
  addBlocklistPhrase: (phrase: string, category: string, action: string, replacement?: string) =>
    fetchWithAuth("/api/admin/blocklist", {
      method: "POST",
      body: JSON.stringify({ phrase, category, action, replacement }),
    }),
  deleteBlocklistPhrase: (id: string) =>
    fetchWithAuth(`/api/admin/blocklist/${id}`, { method: "DELETE" }),
  testBlocklistFilter: (text: string) =>
    fetchWithAuth("/api/admin/blocklist/test", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // Phase 4 — Bot & Fake Profile Detection
  getSuspiciousBots: (minScore = 30) =>
    fetchWithAuth(`/api/admin/bots?minScore=${minScore}`),
  takeBotAction: (userId: string, action: string, reason?: string) =>
    fetchWithAuth(`/api/admin/bots/${userId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    }),

  // Phase 4 — Broadcast Segmentation & Estimation
  estimateBroadcast: (filters: any) =>
    fetchWithAuth("/api/admin/broadcast/estimate", {
      method: "POST",
      body: JSON.stringify(filters),
    }),

  // Phase 4 — In-App Announcements
  getAnnouncements: () => fetchWithAuth("/api/admin/announcements"),
  createAnnouncement: (data: any) =>
    fetchWithAuth("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAnnouncement: (id: string, data: any) =>
    fetchWithAuth(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAnnouncement: (id: string) =>
    fetchWithAuth(`/api/admin/announcements/${id}`, { method: "DELETE" }),

  // Phase 4 — Email Campaigns
  getEmailCampaigns: () => fetchWithAuth("/api/admin/email-campaigns"),
  createEmailCampaign: (data: any) =>
    fetchWithAuth("/api/admin/email-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendEmailCampaign: (id: string) =>
    fetchWithAuth(`/api/admin/email-campaigns/${id}/send`, { method: "POST" }),
  deleteEmailCampaign: (id: string) =>
    fetchWithAuth(`/api/admin/email-campaigns/${id}`, { method: "DELETE" }),

  // Phase 5 — Admin Role Management & RBAC (Feature 24)
  getAdmins: () => fetchWithAuth("/api/admin/roles"),
  assignAdminRole: (userId: string, role: string) =>
    fetchWithAuth(`/api/admin/roles/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  promoteToAdmin: (emailOrUsername: string, role: string) =>
    fetchWithAuth("/api/admin/roles/promote", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername, role }),
    }),
  revokeAdmin: (userId: string) =>
    fetchWithAuth(`/api/admin/roles/${userId}`, { method: "DELETE" }),

  // Phase 5 — Feature Flags (Feature 25)
  getFeatureFlags: () => fetchWithAuth("/api/admin/flags"),
  createFeatureFlag: (data: any) =>
    fetchWithAuth("/api/admin/flags", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateFeatureFlag: (id: string, data: any) =>
    fetchWithAuth(`/api/admin/flags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteFeatureFlag: (id: string) =>
    fetchWithAuth(`/api/admin/flags/${id}`, { method: "DELETE" }),

  // Phase 5 — Subscription Plans & Pricing (Feature 26)
  getPlans: () => fetchWithAuth("/api/admin/plans"),
  createPlan: (data: any) =>
    fetchWithAuth("/api/admin/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlan: (id: string, data: any) =>
    fetchWithAuth(`/api/admin/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deletePlan: (id: string) =>
    fetchWithAuth(`/api/admin/plans/${id}`, { method: "DELETE" }),

  // Phase 5 — App Configuration & Global Limits (Feature 27)
  getAppConfig: () => fetchWithAuth("/api/admin/config"),
  updateAppConfig: (data: any) =>
    fetchWithAuth("/api/admin/config", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Phase 5 — Coupons & Promo Codes (Feature 28)
  getCoupons: () => fetchWithAuth("/api/admin/coupons"),
  createCoupon: (data: any) =>
    fetchWithAuth("/api/admin/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCoupon: (id: string, data: any) =>
    fetchWithAuth(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: string) =>
    fetchWithAuth(`/api/admin/coupons/${id}`, { method: "DELETE" }),

  // Phase 5 — GDPR Data Export (Feature 29)
  exportUserDataUrl: (userId: string) => `/api/admin/users/${userId}/export`,
  exportUserData: (userId: string) => fetchWithAuth(`/api/admin/users/${userId}/export`),

  // Phase 5 — User Impersonation (Feature 30)
  impersonateUser: (userId: string) =>
    fetchWithAuth(`/api/admin/users/${userId}/impersonate`, { method: "POST" }),

  // Phase 6 — Shadowban & Trust Score Matrix (Feature 31)
  getShadowbannedUsers: (page = 1, search = "") =>
    fetchWithAuth(`/api/admin/users/shadowbanned?page=${page}&search=${encodeURIComponent(search)}`),
  toggleShadowban: (userId: string, isShadowbanned: boolean, reason = "") =>
    fetchWithAuth(`/api/admin/users/${userId}/shadowban`, {
      method: "POST",
      body: JSON.stringify({ isShadowbanned, reason }),
    }),
  updateTrustScore: (userId: string, trustScore: number, reason = "") =>
    fetchWithAuth(`/api/admin/users/${userId}/trust-score`, {
      method: "POST",
      body: JSON.stringify({ trustScore, reason }),
    }),

  // Phase 6 — Device & Hardware Blacklist / Multi-Account Clusters (Feature 32)
  getBannedDevices: (page = 1, search = "") =>
    fetchWithAuth(`/api/admin/devices?page=${page}&search=${encodeURIComponent(search)}`),
  banDevice: (data: {
    deviceId?: string;
    hardwareFingerprint?: string;
    ipAddress?: string;
    reason: string;
    autoBanAccounts?: boolean;
    targetUserId?: string;
  }) =>
    fetchWithAuth("/api/admin/devices/ban", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  unbanDevice: (id: string) =>
    fetchWithAuth(`/api/admin/devices/${id}`, { method: "DELETE" }),
  getDeviceClusters: () => fetchWithAuth("/api/admin/devices/clusters"),

  // Phase 6 — Voice Note & Prompt Moderation Queue (Feature 33)
  getPromptModerationStats: () => fetchWithAuth("/api/admin/prompts-moderation/stats"),
  getPromptModeration: (status = "pending", type = "all", page = 1, search = "") =>
    fetchWithAuth(
      `/api/admin/prompts-moderation?status=${status}&type=${type}&page=${page}&search=${encodeURIComponent(search)}`
    ),
  resolvePromptModeration: (
    id: string,
    action: "approve" | "remove" | "warn",
    reason = "",
    adminNotes = ""
  ) =>
    fetchWithAuth(`/api/admin/prompts-moderation/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason, adminNotes }),
    }),
};
