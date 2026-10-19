import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

// Shared HTTP/auth infrastructure used by every feature service. Not a
// feature itself — keep this file to plumbing only (base URL, token
// lifecycle, default headers) so each service stays focused on its own
// domain's endpoints.

export const PRODUCTION_API_URL = "https://soulmate-backend-f1xn.onrender.com";
export const LOCAL_API_URL = "http://192.168.1.74:5000";

// When running locally in development (__DEV__ is true):
// - Uses EXPO_PUBLIC_API_URL from .env if defined, otherwise defaults to LOCAL_API_URL.
// When built into a standalone release APK (__DEV__ is false):
// - Automatically routes to Render production backend (PRODUCTION_API_URL)
//   unless EXPO_PUBLIC_API_URL explicitly provides an https URL.
export const BASE_URL = __DEV__
  ? (process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL)
  : (process.env.EXPO_PUBLIC_API_URL && process.env.EXPO_PUBLIC_API_URL.startsWith("https://")
      ? process.env.EXPO_PUBLIC_API_URL
      : PRODUCTION_API_URL);

console.log("[apiClient] Active BASE_URL:", BASE_URL, "__DEV__:", __DEV__);

let cachedDeviceId: string | null = null;

/**
 * Returns a stable, persistent device identifier.
 * Uses Android ID on Android or a stored UUID on iOS/web.
 */
export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let id = await AsyncStorage.getItem("@soulmate_device_id");
    if (!id) {
      if (Platform.OS === "android") {
        id = Application.getAndroidId() || Crypto.randomUUID();
      } else if (Platform.OS === "ios") {
        id = (await Application.getIosIdForVendorAsync()) || Crypto.randomUUID();
      } else {
        id = Crypto.randomUUID();
      }
      if (id) {
        await AsyncStorage.setItem("@soulmate_device_id", id);
      }
    }
    cachedDeviceId = id || "unknown-device";
    return cachedDeviceId;
  } catch {
    return "unknown-device";
  }
};

let isHandlingAuthFailure = false;
let isHandlingMaintenance = false;

/**
 * Handles 401 (Unauthorized), 403 (Forbidden/Access Denied), and 503 (Maintenance).
 * When the backend rejects the request due to an expired/invalid token or suspension,
 * this clears the stored session and informs the user via Toast.
 * Throttled to prevent multiple simultaneous requests from spamming logouts/toasts.
 */
export const handleAuthFailure = async (response: Response): Promise<boolean> => {
  if (response.status === 503) {
    if (!isHandlingMaintenance) {
      isHandlingMaintenance = true;
      try {
        let message = "We are currently undergoing scheduled maintenance. Please check back shortly.";
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data?.message) message = data.message;
        } catch {}

        Toast.show({
          type: "error",
          text1: "Maintenance Mode",
          text2: message,
          visibilityTime: 5000,
        });
      } finally {
        setTimeout(() => {
          isHandlingMaintenance = false;
        }, 5000);
      }
    }
    return true;
  }

  if (response.status === 401 || response.status === 403) {
    const currentToken = token || (await AsyncStorage.getItem("token"));
    if (currentToken && !isHandlingAuthFailure) {
      isHandlingAuthFailure = true;
      try {
        let message = "Your session has expired. Please log in again.";
        try {
          const clone = response.clone();
          const data = await clone.json();
          if (data?.message) {
            message = data.message;
          }
        } catch {}

        Toast.show({
          type: "error",
          text1: response.status === 403 ? "Access Denied" : "Session Expired",
          text2: message,
          visibilityTime: 4000,
        });

        await clearToken();
      } finally {
        setTimeout(() => {
          isHandlingAuthFailure = false;
        }, 3000);
      }
      return true;
    }
  }
  return false;
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const deviceId = await getDeviceId().catch(() => "");
    const headers = new Headers(options.headers || {});
    if (deviceId && !headers.has("x-device-id")) {
      headers.set("x-device-id", deviceId);
    }

    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
      await handleAuthFailure(res);
    }
    return res;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(`Connection timed out (${timeoutMs / 1000}s). Server at ${BASE_URL} is unreachable.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Token kept in memory for synchronous access (e.g. building auth headers
// without an extra await); AsyncStorage remains the source of truth across
// app restarts.
export let token: string | null = null;

// Module-level pub-sub (same pattern as Toast/GlobalActionSheet) so the root
// layout's isLoggedIn state stays in sync with the token instead of only
// being checked once on cold start — login/logout/expiry all flow through
// saveToken/clearToken, so subscribing here catches every case.
type AuthListener = (loggedIn: boolean) => void;
let authListener: AuthListener | null = null;
export const onAuthChange = (listener: AuthListener | null) => {
  authListener = listener;
};

export const initToken = async (): Promise<void> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (storedToken) token = storedToken;
};

export const saveToken = async (newToken: string): Promise<void> => {
  token = newToken;
  await AsyncStorage.setItem("token", newToken);
  authListener?.(true);
};

export const clearToken = async (): Promise<void> => {
  token = null;
  await AsyncStorage.removeItem("token");
  authListener?.(false);
};

export const getCurrentUserId = async (): Promise<string | null> => {
  const t = token || (await AsyncStorage.getItem("token"));
  if (!t) return null;
  try {
    return JSON.parse(atob(t.split(".")[1])).id;
  } catch {
    return null;
  }
};

export const getHeaders = (withAuth: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth && token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// --- Client Configuration & Announcements ---

export interface ClientLimits {
  freeDailySwipeLimit: number;
  premiumDailySwipeLimit: number;
  freeSuperLikesPerWeek: number;
  boostDurationMinutes: number;
  defaultDiscoveryRadiusKm: number;
  maxDiscoveryRadiusKm: number;
}

export interface ClientConfigResponse {
  limits: ClientLimits;
  maintenance: {
    active: boolean;
    notice: string;
  };
}

export const fetchClientConfig = async (): Promise<ClientConfigResponse | null> => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/config/client`, {
      method: "GET",
      headers: getHeaders(false),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export interface AnnouncementItem {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "promo" | "critical";
  ctaText?: string;
  ctaLink?: string;
}

export const fetchActiveAnnouncements = async (): Promise<AnnouncementItem[]> => {
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/announcements/active`, {
      method: "GET",
      headers: getHeaders(false),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.announcements || [];
  } catch {
    return [];
  }
};
