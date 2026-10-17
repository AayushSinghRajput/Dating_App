import React from "react";
import { View } from "react-native";

/**
 * Fallback route for /call deep links.
 * Call UI is handled overlay-style by IncomingCallModal rendered in root layout.
 * Having this component prevents Expo Router from ever showing "Unmatched Route: /call".
 */
export default function CallRoute() {
  return <View style={{ flex: 1, backgroundColor: "#0B141B" }} />;
}
