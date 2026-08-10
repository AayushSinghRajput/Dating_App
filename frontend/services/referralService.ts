import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
}

export const getReferralInfo = async (): Promise<ReferralInfo> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/referrals/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load referral info");
  return data;
};
