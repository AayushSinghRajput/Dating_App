import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun.cloudflare.com:3478",
    ],
  },
];

let cachedIceServers: IceServerConfig[] | null = null;
let lastFetchedAt = 0;
const CACHE_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes in-memory cache

/**
 * Fetches dedicated WebRTC ICE/TURN servers from the backend.
 * Falls back to public STUN if backend is unreachable or offline.
 */
export const getIceServers = async (): Promise<IceServerConfig[]> => {
  const now = Date.now();
  if (cachedIceServers && now - lastFetchedAt < CACHE_LIFETIME_MS) {
    return cachedIceServers;
  }

  const authToken = await AsyncStorage.getItem("token");
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/calls/ice-servers`, { headers });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
        cachedIceServers = data.iceServers;
        lastFetchedAt = now;
        return data.iceServers;
      }
    }
  } catch (error) {
    console.warn("[WebRTC] Could not fetch dynamic ICE servers, using fallback:", error);
  }

  return DEFAULT_ICE_SERVERS;
};

/**
 * Retrieves the SDP offer for an active call from the backend.
 * Critical fallback when push notification or socket didn't include the SDP offer.
 */
export const getCallOfferApi = async (callId: string): Promise<any | null> => {
  if (!callId) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/calls/${callId}/offer`);
    if (res.ok) {
      const data = await res.json();
      return data?.offer || null;
    }
  } catch (error) {
    console.warn("[CallService] Error fetching call offer via HTTP:", error);
  }
  return null;
};

/**
 * Relays an answered call SDP answer to the caller via backend HTTP.
 * Serves as a reliable backup when socket is reconnecting.
 */
export const answerCallApi = async (
  callId: string,
  toUserId: string,
  answer: any
): Promise<boolean> => {
  if (!callId || !answer) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/calls/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId, toUserId, answer }),
    });
    return res.ok;
  } catch (error) {
    console.warn("[CallService] Error relaying answer via HTTP:", error);
    return false;
  }
};

/**
 * Rejects or declines an active incoming call on the backend.
 * Serves as a reliable fallback so the caller is immediately notified even if socket is reconnecting.
 */
export const rejectCallApi = async (callId: string, toUserId?: string): Promise<boolean> => {
  if (!callId && !toUserId) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/calls/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, toUserId }),
    });
    return res.ok;
  } catch (error) {
    console.warn("[CallService] Error notifying backend of call rejection:", error);
    return false;
  }
};

/**
 * Ends or cancels an active or ringing call on the backend via HTTP.
 * Serves as a reliable fallback so the recipient is immediately notified even during socket reconnects.
 */
export const endCallApi = async (callId: string, toUserId?: string): Promise<boolean> => {
  if (!callId && !toUserId) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/calls/end`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ callId, toUserId }),
    });
    return res.ok;
  } catch (error) {
    console.warn("[CallService] Error notifying backend of call end:", error);
    return false;
  }
};
