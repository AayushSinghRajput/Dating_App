import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCall } from "@/contexts/CallContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function IncomingCallModal() {
  const { colors } = useTheme();
  const { callStatus, callType, remoteUser, acceptCall, rejectCall } = useCall();

  const visible = callStatus === "incoming-ringing" && !!remoteUser;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={{ uri: remoteUser?.avatar || "https://placehold.co/200x200" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{remoteUser?.name}</Text>
          <Text style={styles.subtitle}>
            Incoming {callType === "video" ? "video" : "audio"} call…
          </Text>

          <View style={styles.actions}>
            <View style={styles.actionColumn}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.accent }]}
                onPress={rejectCall}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </Pressable>
              <Text style={styles.actionLabel}>Decline</Text>
            </View>

            <View style={styles.actionColumn}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={acceptCall}
              >
                <Ionicons
                  name={callType === "video" ? "videocam" : "call"}
                  size={28}
                  color="#fff"
                />
              </Pressable>
              <Text style={styles.actionLabel}>Accept</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32,
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
  subtitle: {
    fontSize: 15,
    color: "#ddd",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    marginTop: 64,
    gap: 56,
  },
  actionColumn: {
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
