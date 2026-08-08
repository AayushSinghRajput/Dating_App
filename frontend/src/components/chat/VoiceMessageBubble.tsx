import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTheme } from "@/contexts/ThemeContext";
import { formatClockTime } from "./chatListHelpers";

export default function VoiceMessageBubble({
  uri,
  duration,
  isMine,
}: {
  uri: string;
  duration: number;
  isMine: boolean;
}) {
  const { colors } = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const total = status.duration || duration || 0;
  const current = Math.min(status.currentTime || 0, total);
  const progress = total > 0 ? current / total : 0;
  const displaySeconds = status.playing || current > 0 ? current : total;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (total > 0 && current >= total) {
      player.seekTo(0);
    }
    player.play();
  };

  // "Mine" bubbles have a solid accent background, so playback controls need
  // to be white for contrast; "their" bubbles are neutral, so it's the reverse.
  const playButtonBg = isMine ? "rgba(255,255,255,0.9)" : colors.accent;
  const iconColor = isMine ? colors.accent : "#fff";
  const trackColor = isMine ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.12)";
  const fillColor = isMine ? "#fff" : colors.accent;
  const textColor = isMine ? "#fff" : colors.text;

  return (
    <View style={styles.voiceRow}>
      <Pressable
        onPress={toggle}
        style={[styles.voicePlayButton, { backgroundColor: playButtonBg }]}
      >
        <Ionicons name={status.playing ? "pause" : "play"} size={16} color={iconColor} />
      </Pressable>
      <View style={[styles.voiceProgressTrack, { backgroundColor: trackColor }]}>
        <View
          style={[
            styles.voiceProgressFill,
            { width: `${Math.round(progress * 100)}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
      <Text style={[styles.voiceDuration, { color: textColor }]}>
        {formatClockTime(displaySeconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 160,
    paddingVertical: 2,
  },
  voicePlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceProgressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  voiceProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
