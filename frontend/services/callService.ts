import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

let cachedIceServers: IceServerConfig[] | null = null;
let lastFetchedAt = 0;
const CACHE_LIFETIME_MS = 30 * 60 * 1000; // 30 minutes in-memory cache

/**
 * Fetches dedicated WebRTC ICE/TURN servers from the backend.
 * Falls back to public STUN/TURN if backend is unreachable or offline.
 */
export const getIceServers = async (): Promise<IceServerConfig[]> => {
  const now = Date.now();
  if (cachedIceServers && now - lastFetchedAt < CACHE_LIFETIME_MS) {
    return cachedIceServers;
  }

  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) {
    return DEFAULT_ICE_SERVERS;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/calls/ice-servers`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

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
