import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Image, Pressable, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { createOrGetChat } from "@/utils/api";

interface MatchParams {
  userName: string;
  userAvatar?: string;
  otherUserId: string;
}

// Same module-level pub-sub pattern as GlobalActionSheet/Toast: lets any
// screen trigger the celebration without threading state through the tree.
let listener: ((params: MatchParams) => void) | null = null;

export function showMatchCelebration(params: MatchParams) {
  listener?.(params);
}

export default function GlobalMatchCelebration() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState<MatchParams | null>(null);
  const [opening, setOpening] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    listener = (p) => {
      setParams(p);
      setVisible(true);
      scaleAnim.setValue(0.6);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };
    return () => {
      listener = null;
    };
  }, [scaleAnim]);

  const close = () => setVisible(false);

  const handleMessage = async () => {
    if (!params || opening) return;
    setOpening(true);
    try {
      const chat = await createOrGetChat(params.otherUserId);
      close();
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: params.userName,
          avatar: params.userAvatar || "",
          otherUserId: params.otherUserId,
        },
      });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to open chat", text2: err.message });
    } finally {
      setOpening(false);
    }
  };

  if (!params) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <LinearGradient
        colors={["#ff6b6b", "#ff8e8e", "#ffa8a8", "#ffb3ba"]}
        style={styles.container}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="heart" size={68} color="#fff" />
          <Text style={styles.title}>It&apos;s a Match!</Text>

          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: params.userAvatar || "https://placehold.co/200x200" }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.subtitle}>
            You and {params.userName} liked each other
          </Text>

          <Pressable
            style={[styles.primaryButton, opening && styles.buttonDisabled]}
            onPress={handleMessage}
            disabled={opening}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#ff6b6b" />
            <Text style={styles.primaryButtonText}>Send a Message</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={close}>
            <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
    marginTop: 12,
    marginBottom: 24,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  avatarWrapper: {
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 36,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    marginBottom: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
