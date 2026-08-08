import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Message } from "@/utils/api";

export default function CallLogRow({ message }: { message: Message }) {
  const { colors } = useTheme();
  const call = message.call;
  if (!call) return null;

  const isVideo = call.callType === "video";
  const icon = isVideo ? "videocam" : "call";
  const isMissedOrDeclined = call.status === "missed" || call.status === "rejected";
  const tintColor = isMissedOrDeclined ? "#e05252" : colors.textSecondary;

  let label: string;
  if (call.status === "answered") {
    const m = Math.floor(call.duration / 60).toString().padStart(2, "0");
    const s = (call.duration % 60).toString().padStart(2, "0");
    label = `${isVideo ? "Video" : "Voice"} call · ${m}:${s}`;
  } else if (call.status === "missed") {
    label = message.fromMe ? "No answer" : `Missed ${isVideo ? "video" : "voice"} call`;
  } else {
    label = message.fromMe ? "Call declined" : "You declined";
  }

  return (
    <View style={styles.callLogRow}>
      <View style={[styles.callLogPill, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={15} color={tintColor} />
        <Text style={[styles.callLogText, { color: tintColor }]}>{label}</Text>
        <Text style={[styles.callLogTime, { color: colors.textTertiary }]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  callLogRow: {
    alignItems: "center",
    marginVertical: 6,
  },
  callLogPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  callLogText: {
    fontSize: 13,
    fontWeight: "600",
  },
  callLogTime: {
    fontSize: 11,
  },
});
