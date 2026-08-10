import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

export const likeProfile = async (targetProfileId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${BASE_URL}/api/match/like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetProfileId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to like profile");
    return data;
  } catch (error: any) {
    console.error("Error liking profile:", error.message);
    throw new Error(error.message || "Failed to like profile");
  }
};

export const superLikeProfile = async (targetProfileId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${BASE_URL}/api/match/super-like`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetProfileId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to send super like");
    return data;
  } catch (error: any) {
    console.error("Error super-liking profile:", error.message);
    throw new Error(error.message || "Failed to send super like");
  }
};

export const rewindLastSwipe = async (): Promise<{ targetProfileId: string }> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const response = await fetch(`${BASE_URL}/api/match/rewind`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to rewind");
  return data;
};

export const passProfile = async (targetProfileId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${BASE_URL}/api/match/pass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetProfileId }),
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(
      "Error passing profile:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Failed to pass profile");
  }
};

/**
 * Get all matches for the logged-in user
 */
export const getMatches = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${BASE_URL}/api/match/matches`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data.matches;
  } catch (error: any) {
    console.error(
      "Error fetching matches:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Failed to get matches");
  }
};

export interface LikedByProfile {
  id: string;
  userId: string;
  name: string;
  age?: number;
  profileImage?: string;
  location?: string;
  isSuperLike?: boolean;
}

export const getLikedByMe = async (): Promise<LikedByProfile[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/match/liked-by`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch who liked you");
  return data.profiles;
};

export const unmatchUser = async (targetUserId: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/match/unmatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ targetUserId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to unmatch");
};
