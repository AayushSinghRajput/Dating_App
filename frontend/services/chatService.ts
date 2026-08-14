import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL, getCurrentUserId } from "./apiClient";

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

// Marks every unread message in a chat (from the other participant) as read.
export const markChatRead = async (chatId: string): Promise<void> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  await fetch(`${BASE_URL}/api/chats/${chatId}/read`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Total unread messages across all chats — powers the Chat tab badge.
export const getUnreadChatsCount = async (): Promise<number> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("User not authenticated");
  const res = await fetch(`${BASE_URL}/api/chats/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch unread count");
  const data = await res.json();
  return data.count;
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
