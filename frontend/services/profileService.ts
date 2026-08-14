import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL, token, initToken } from "./apiClient";
import { ProfilePrompt } from "@/src/constants/prompts";

export interface PhotoAsset {
  uri: string;
  name?: string;
  type?: string;
}

export interface Profile {
  _id?: string;
  user?: { username: string; email: string };
  profileImage?: string;
  // Local photo assets to upload; appended to the profile's existing photos.
  photos?: PhotoAsset[];
  location?: string;
  aboutMe?: string;
  gender?: string;
  interestedIn?: string;
  age?: number;
  hobbies?: string[];
  education?: string;
  profession?: string;
  relationshipGoals?: string;
  bio?: string;
  goal?: string;
  name?: string;
  profilePic?: string;
  incognito?: boolean;
  verified?: boolean;
  prompts?: ProfilePrompt[];
}

export interface ProfileResponse {
  message: string;
  profile: Profile;
  success?: boolean;
}

// 🔹 Create or Update Profile
export const createOrUpdateProfile = async (
  profileData: Profile
): Promise<ProfileResponse> => {
  try {
    if (!token) await initToken();
    if (!token) throw new Error("User not authenticated.");

    const formData = new FormData();

    // ✅ Append all fields correctly (including arrays & newly-picked photos)
    Object.entries(profileData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === "photos" && Array.isArray(value)) {
        // Local photo assets to upload; already-stored photo URLs are managed
        // separately via removePhotoApi/setPrimaryPhotoApi, not resent here.
        value.forEach((photo: any) => {
          if (photo?.uri) {
            formData.append("photos", {
              uri: photo.uri,
              name: photo.name || `photo-${Date.now()}.jpg`,
              type: photo.type || "image/jpeg",
            } as any);
          }
        });
      } else if (key === "prompts" && Array.isArray(value)) {
        // Array of {question, answer} objects — FormData.append only accepts
        // strings/files, so a raw object here breaks RN's multipart encoder
        // before the request is even sent ("Network request failed").
        // Serialize as JSON; the backend parses it back out.
        formData.append("prompts", JSON.stringify(value));
      } else if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, v));
      } else {
        formData.append(key, value as any);
      }
    });

    // ✅ Hit backend route (your createOrUpateProfile)
    const res = await fetch(`${BASE_URL}/api/profile/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data: ProfileResponse = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to save profile.");

    return { ...data, success: true };
  } catch (error: any) {
    console.error("Profile Error:", error);
    if (error.name === "TypeError")
      throw new Error("Network error. Check your connection.");
    throw new Error(error.message || "Something went wrong.");
  }
};

// 🔹 Get Current User Profile
export const getProfile = async (): Promise<Profile> => {
  try {
    if (!token) await initToken();
    if (!token) throw new Error("User not authenticated.");

    const res = await fetch(`${BASE_URL}/api/profile/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch profile.");

    return data.profile || data;
  } catch (error: any) {
    if (error.name === "TypeError")
      throw new Error("Network error. Check your connection.");
    throw new Error(error.message);
  }
};

// Shape returned by GET /api/profile/allprofiles (see profileController.js's
// getAllProfiles) — the discovery feed.
export interface DiscoveryProfile {
  id: string;
  userId: string;
  name: string;
  age?: number;
  profileImage?: string;
  photos?: string[];
  profession?: string;
  location?: string;
  aboutMe?: string;
  gender?: string;
  interestedIn?: string;
  hobbies?: string[];
  education?: string;
  relationshipGoals?: string;
  isVerified?: boolean;
  prompts?: ProfilePrompt[];
  isBoosted?: boolean;
}

//Get all profiles
export const getAllProfiles = async (): Promise<DiscoveryProfile[]> => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token)  throw new Error("User not authenticated.");

    const response = await fetch(`${BASE_URL}/api/profile/allprofiles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend returned:", errorText);
      throw new Error("Failed to fetch profiles. check backend logs.");
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching profiles:", error.message);
    if (error.name === "TypeError") {
      throw new Error("Network error.Check your connection");
    }
    throw new Error(error.message);
  }
};

export interface PhotosResponse {
  message: string;
  photos: string[];
  profileImage: string;
}

export const removePhotoApi = async (url: string): Promise<PhotosResponse> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/photos`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to remove photo");
  return data;
};

export const setPrimaryPhotoApi = async (url: string): Promise<PhotosResponse> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/photos/primary`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to set primary photo");
  return data;
};

export const setIncognitoModeApi = async (incognito: boolean): Promise<boolean> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/incognito`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ incognito }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update incognito mode");
  return data.incognito;
};

export const submitVerificationSelfie = async (fileUri: string): Promise<boolean> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");

  let result: FileSystem.FileSystemUploadResult;
  try {
    result = await FileSystem.uploadAsync(
      `${BASE_URL}/api/profile/verify`,
      fileUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "selfie",
        mimeType: "image/jpeg",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
  } catch (err: any) {
    throw new Error(`Upload failed: ${err?.message || "Unknown error"}`);
  }

  let data: any;
  try {
    data = JSON.parse(result.body);
  } catch {
    throw new Error("Failed to submit verification photo: invalid server response");
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(data?.message || "Failed to submit verification photo");
  }
  return data.verified;
};

export const toggleFavorite = async (targetUserId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(
      `${BASE_URL}/api/profile/${targetUserId}/favorite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Toggle favorite failed:", data.message);
      Alert.alert("Error", data.message || "Something went wrong");
      return null;
    }

    return data; // { message, favorites }
  } catch (err) {
    console.error("Toggle favorite error:", err);
    Alert.alert("Error", "Unable to update favorite");
    return null;
  }
};

export const getFavorites = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${BASE_URL}/api/profile/favorites`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Get favorites failed:", data.message);
      Alert.alert("Error", data.message || "Something went wrong");
      return [];
    }

    return data.favorites; // array of favorited users
  } catch (err) {
    console.error("Get favorites error:", err);
    Alert.alert("Error", "Unable to fetch favorites");
    return [];
  }
};

export interface BlockedUser {
  _id: string;
  username: string;
  profileImage?: string;
  age?: number;
  location?: string;
}

export const blockUserApi = async (targetUserId: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/${targetUserId}/block`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to block user");
};

export const unblockUserApi = async (targetUserId: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/${targetUserId}/unblock`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to unblock user");
};

export const getBlockedUsersApi = async (): Promise<BlockedUser[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/profile/blocked`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch blocked users");
  return data.blockedUsers;
};
