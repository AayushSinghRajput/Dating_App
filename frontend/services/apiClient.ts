import AsyncStorage from "@react-native-async-storage/async-storage";

// Shared HTTP/auth infrastructure used by every feature service. Not a
// feature itself — keep this file to plumbing only (base URL, token
// lifecycle, default headers) so each service stays focused on its own
// domain's endpoints.

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Token kept in memory for synchronous access (e.g. building auth headers
// without an extra await); AsyncStorage remains the source of truth across
// app restarts.
export let token: string | null = null;

export const initToken = async (): Promise<void> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (storedToken) token = storedToken;
};

export const saveToken = async (newToken: string): Promise<void> => {
  token = newToken;
  await AsyncStorage.setItem("token", newToken);
};

export const clearToken = async (): Promise<void> => {
  token = null;
  await AsyncStorage.removeItem("token");
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
