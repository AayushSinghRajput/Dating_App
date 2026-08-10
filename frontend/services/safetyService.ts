import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./apiClient";

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
