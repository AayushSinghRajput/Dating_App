import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

// 🌍 Base URL 
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


// 🔐 Token stored in memory
let token: string | null = null;

// ================================
// 🧩 Types and Interfaces
// ================================
export interface AuthResponse {
  token?: string;
  message?: string;
  user?: UserProfile;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

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
}

export interface ProfileResponse {
  message: string;
  profile: Profile;
  success?: boolean;
}

export interface CallLogInfo {
  callType: "audio" | "video";
  status: "answered" | "missed" | "rejected";
  duration: number;
  caller?: string;
}

export interface AudioMessageInfo {
  url: string;
  duration: number;
}

export interface MediaMessageInfo {
  url: string;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp?: string;
  createdAt?: string;
  senderName?: string;
  senderAvatar?: string;
  failed?:boolean;
  retrying?:boolean;
  chat?:string;
  type?: "text" | "call" | "audio" | "image" | "video";
  call?: CallLogInfo;
  audio?: AudioMessageInfo;
  media?: MediaMessageInfo;
  deleted?: boolean;
  sender?:{
    _id:string;
    username?:string;
    avatar?:string;
    currentUserId?:string;
  };
  read?:boolean;
}

export interface Chat {
  id: string;
  otherUserId?: string;
  userName: string;
  avatar: string;
  lastMessage?: string;
  isOnline?: boolean;
}

// ================================
// 🔧 Token Management
// ================================
export const initToken = async (): Promise<void> => {
  const storedToken = await AsyncStorage.getItem("token");
  if (storedToken) token = storedToken;
};

const saveToken = async (newToken: string): Promise<void> => {
  token = newToken;
  await AsyncStorage.setItem("token", newToken);
};

export const clearToken = async (): Promise<void> => {
  token = null;
  await AsyncStorage.removeItem("token");
};

export const deleteAccount = async (password: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete account");
  await clearToken();
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change password");
};

export interface CurrentUserInfo {
  _id: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

export const getMe = async (): Promise<CurrentUserInfo> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch account info");
  return data;
};

export const sendVerificationEmail = async (): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/send-verification-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send verification email");
};

export const verifyEmail = async (code: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to verify email");
};

export const changeEmail = async (
  newEmail: string,
  password: string
): Promise<{ email: string }> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/auth/change-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ newEmail, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to change email");
  return data;
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

// ================================
// 🧰 Helper Functions
// ================================
const getHeaders = (withAuth: boolean = false): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (withAuth && token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ================================
// 🔑 AUTH API CALLS
// ================================

// 🔹 Login
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data: AuthResponse = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed.");

    if (data.token) await saveToken(data.token);
    return data;
  } catch (error: any) {
    if (error.name === "TypeError")
      throw new Error("Network error. Check your connection.");
    throw new Error(error.message);
  }
};

// 🔹 Sign in (or sign up) with a Google ID token
export const googleSignIn = async (
  idToken: string,
  acceptedTerms?: boolean
): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ idToken, acceptedTerms }),
  });
  const data: AuthResponse & { requiresSignup?: boolean } = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.message || "Google sign-in failed.");
    error.requiresSignup = data.requiresSignup;
    throw error;
  }
  if (data.token) await saveToken(data.token);
  return data;
};

// 🔹 Forgot password: request a reset code by email
export const forgotPassword = async (email: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to request reset code.");
};

// 🔹 Reset password using the emailed code
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reset password.");
};

// 🔹 Register
export const register = async (
  username: string,
  email: string,
  password: string,
  acceptedTerms: boolean,
  referralCode?: string
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password, acceptedTerms, referralCode }),
    });

    const data: AuthResponse = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed.");

    if (data.token) await saveToken(data.token);
    return data;
  } catch (error: any) {
    if (error.name === "TypeError")
      throw new Error("Network error. Check your connection.");
    throw new Error(error.message);
  }
};

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

// ================================
// 👤 PROFILE API CALLS
// ================================

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

export interface EmergencyContact {
  name: string;
  phone: string;
}

export const getEmergencyContacts = async (): Promise<EmergencyContact[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/safety/emergency-contacts`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load emergency contacts");
  return data.contacts;
};

export const updateEmergencyContacts = async (
  contacts: EmergencyContact[]
): Promise<EmergencyContact[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/safety/emergency-contacts`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ contacts }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update emergency contacts");
  return data.contacts;
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

//Get all profiles
export const getAllProfiles = async () => {
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

//Get all chats
export const getAllChats = async () => {
  try {
    // 1. Get token from AsyncStorage
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    // 2. Call the API
    const response = await fetch(`${BASE_URL}/api/chats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // 3. Check for server errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch chats");
    }

    // 4. Parse and return JSON data
    const chats = await response.json();
    return chats;
  } catch (error:any) {
    console.error("Error fetching chats:", error.message);
    throw error; // Re-throw error so calling code can handle it
  }
};

//Create a chat with another user, or get the existing one
export const createOrGetChat = async (
  receiverId: string
): Promise<{ _id: string }> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/chats`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ receiverId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create chat");
  return data;
};

//Get chatbyId
export const getChatById = async (chatId: string): Promise<Chat> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch chat");
  return res.json();
};

export const getMessagesByChatId = async (
  chatId: string
): Promise<Message[]> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");

  const currentUserId = await getCurrentUserId();

  const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch messages");

  const data = await res.json();
  return data.map((m: any) => ({
    id: m._id,
    text: m.text,
    fromMe: m.sender._id === currentUserId,
    createdAt: m.createdAt,
    timestamp: new Date(m.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    senderName: m.sender.username,
    senderAvatar: m.sender.profileImage || "",
    type: m.type || "text",
    call: m.call,
    audio: m.audio,
    media: m.media,
    deleted: m.deleted,
  }));
};

export const sendMessageApi = async (chatId: string, message: string) =>{
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${BASE_URL}/api/chats/message`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatId, text : message }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send message");
    }
    return data;
  } catch (error:any) {
    console.error("Failed to send message:",error.message || error);
  }
};

export const sendVoiceMessageApi = async (
  chatId: string,
  fileUri: string,
  duration: number
): Promise<any> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");

  // Uses expo-file-system's native upload instead of fetch()+FormData: on
  // Android's New Architecture, fetch can't reliably read a local file://
  // URI into a multipart body and fails immediately with a generic
  // "Network request failed" before any request is even sent.
  let result: FileSystem.FileSystemUploadResult;
  try {
    result = await FileSystem.uploadAsync(
      `${BASE_URL}/api/chats/message/audio`,
      fileUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "audio",
        mimeType: "audio/m4a",
        parameters: { chatId, duration: String(duration) },
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
    throw new Error("Failed to send voice message: invalid server response");
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(data?.message || "Failed to send voice message");
  }
  return data;
};

export const sendMediaMessageApi = async (
  chatId: string,
  fileUri: string,
  mimeType: string
): Promise<any> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");

  let result: FileSystem.FileSystemUploadResult;
  try {
    result = await FileSystem.uploadAsync(
      `${BASE_URL}/api/chats/message/media`,
      fileUri,
      {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "media",
        mimeType,
        parameters: { chatId },
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
    throw new Error("Failed to send media message: invalid server response");
  }

  if (result.status < 200 || result.status >= 300) {
    throw new Error(data?.message || "Failed to send media message");
  }
  return data;
};

export const deleteMessageApi = async (
  messageId: string,
  mode: "me" | "everyone"
): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/chats/message/${messageId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ mode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete message");
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

// Like a profile

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

//  Pass a profile

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

// ================================
// 🔔 NOTIFICATIONS
// ================================

export interface AppNotification {
  _id: string;
  type: "like" | "match" | "missed_call" | "favorite";
  chat?: string;
  callType?: "audio" | "video";
  read: boolean;
  createdAt: string;
  fromUser: {
    _id: string;
    username: string;
    profileImage?: string;
  } | null;
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch notifications");
  return data;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch unread count");
  return data.count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${authToken}` },
  });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  await fetch(`${BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${authToken}` },
  });
};

export interface NotificationPreferences {
  like: boolean;
  match: boolean;
  missed_call: boolean;
  favorite: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch preferences");
  return data.preferences;
};

export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const authToken = await AsyncStorage.getItem("token");
  if (!authToken) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update preferences");
  return data.preferences;
};
