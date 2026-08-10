import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export type ReportReason =
  | "inappropriate_content"
  | "fake_profile"
  | "harassment"
  | "spam"
  | "other";

export const reportUserApi = async (
  targetUserId: string,
  reason: ReportReason
): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/reports/${targetUserId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to submit report");
};
