import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, getHeaders, saveToken, clearToken } from "./apiClient";

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token?: string;
  message?: string;
  user?: UserProfile;
}

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
