import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RTCView } from "react-native-webrtc";
import { useCall } from "@/contexts/CallContext";
import { useTheme } from "@/contexts/ThemeContext";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function InCallScreen() {
  const { colors } = useTheme();
  const {
    callStatus,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    isMuted,
    isSpeakerOn,
    isFrontCamera,
    endCall,
    toggleMute,
    toggleSpeaker,
    flipCamera,
  } = useCall();

  const [duration, setDuration] = useState(0);

  const visible = callStatus === "outgoing-ringing" || callStatus === "connected";
  const connected = callStatus === "connected";

  useEffect(() => {
    if (!connected) {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [connected]);

  if (!visible) return null;

  const isVideo = callType === "video";

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {isVideo && connected && remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={styles.avatarBackdrop}>
            <Image
              source={{ uri: remoteUser?.avatar || "https://placehold.co/200x200" }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{remoteUser?.name}</Text>
            <Text style={styles.status}>
              {connected ? formatDuration(duration) : "Ringing…"}
            </Text>
          </View>
        )}

        {isVideo && connected && localStream && (
          <View style={styles.localPreview}>
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={isFrontCamera}
            />
          </View>
        )}

        {isVideo && connected && (
          <View style={styles.topBar}>
            <Text style={styles.topBarName}>{remoteUser?.name}</Text>
            <Text style={styles.topBarStatus}>{formatDuration(duration)}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <Pressable
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
          </Pressable>

          {isVideo && (
            <Pressable style={styles.controlButton} onPress={flipCamera}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </Pressable>
          )}

          <Pressable
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isSpeakerOn ? "volume-high" : "volume-medium"}
              size={24}
              color="#fff"
            />
          </Pressable>

          <Pressable
            style={[styles.controlButton, { backgroundColor: colors.accent }]}
            onPress={endCall}
          >
            <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  remoteVideo: {
    flex: 1,
  },
  avatarBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#333",
    marginBottom: 20,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
  },
  status: {
    fontSize: 15,
    color: "#ccc",
    marginTop: 8,
  },
  localPreview: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 110,
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#333",
  },
  localVideo: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: 20,
  },
  topBarName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  topBarStatus: {
    fontSize: 13,
    color: "#ddd",
    marginTop: 2,
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButtonActive: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
