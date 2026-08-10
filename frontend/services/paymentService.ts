import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export interface PremiumStatus {
  isPremium: boolean;
  premiumExpiresAt: string | null;
  likesUsedToday: number;
  likesRemaining: number | null;
  superLikesUsedToday: number;
  superLikesRemaining: number;
  boostedUntil: string | null;
  boostActive: boolean;
}

export const initiateEsewaPayment = async (): Promise<{ formUrl: string }> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/payments/esewa/initiate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to start eSewa payment");
  return data;
};

export const initiateKhaltiPayment = async (): Promise<{ paymentUrl: string }> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/payments/khalti/initiate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to start Khalti payment");
  return data;
};

export const getPremiumStatus = async (): Promise<PremiumStatus> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/premium/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load premium status");
  return data;
};

export const activateBoost = async (): Promise<{ boostedUntil: string }> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/premium/boost`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to activate boost");
  return data;
};
