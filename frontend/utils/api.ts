import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

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

export interface Profile {
  _id?: string;
  user?: { username: string; email: string };
  profileImage?: any; 
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
}

export interface ProfileResponse {
  message: string;
  profile: Profile;
  success?: boolean;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  timestamp?: string;
  senderName?: string;
  senderAvatar?: string;
  failed?:boolean;
  retrying?:boolean;
  chat?:string;
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

// 🔹 Register
export const register = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ username, email, password }),
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

    // ✅ Append all fields correctly (including arrays & image)
    Object.entries(profileData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === "profileImage" && value?.uri) {
        // Image handling
        formData.append("profileImage", {
          uri: value.uri,
          name: value.name || "profile.jpg",
          type: value.type || "image/jpeg",
        } as any);
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

  //decode token to get current user ID
  const payload = JSON.parse(atob(token.split(".")[1]));
  const currentUserId = payload.id;

  const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch messages");

  const data = await res.json();
  return data.map((m: any) => ({
    id: m._id,
    text: m.text,
    fromMe: m.sender._id === currentUserId,
    timestamp: new Date(m.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    senderName: m.sender.username,
    senderAvatar: m.sender.profileImage || "",
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
    return data;
  } catch (error: any) {
    console.error(
      "Error liking profile:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Failed to like profile");
  }
};

//  Pass a profile

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
