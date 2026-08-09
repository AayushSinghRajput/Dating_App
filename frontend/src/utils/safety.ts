import * as Location from "expo-location";
import { Share } from "react-native";

export async function shareMyLocation(): Promise<void> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission is required to share your location.");
  }

  const position = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = position.coords;
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  await Share.share({
    message: `I'm sharing my live location for safety: ${mapsUrl}`,
  });
}
