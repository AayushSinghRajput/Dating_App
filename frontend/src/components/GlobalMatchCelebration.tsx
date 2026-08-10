import { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { createOrGetChat } from "@/services/chatService";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";

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

const BLURHASH = "L5H2EC=PM+yV0g-mq.wG9c010J}I";

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
        accessibilityViewIsModal
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="heart" size={68} color="#fff" />
          <Text style={styles.title} accessibilityRole="header">
            It&apos;s a Match!
          </Text>

          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: params.userAvatar || "https://placehold.co/200x200" }}
              style={styles.avatar}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              transition={200}
              cachePolicy="disk"
              accessibilityLabel={`${params.userName}'s profile photo`}
            />
          </View>

          <Text style={styles.subtitle}>You and {params.userName} liked each other</Text>

          <Pressable
            style={[styles.primaryButton, opening && styles.buttonDisabled]}
            onPress={handleMessage}
            disabled={opening}
            accessibilityRole="button"
            accessibilityLabel={`Send a message to ${params.userName}`}
            accessibilityState={{ disabled: opening, busy: opening }}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#ff6b6b" />
            <Text style={styles.primaryButtonText}>Send a Message</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Dismiss and keep swiping"
          >
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
    padding: spacing.xl,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    ...typography.display,
    color: "#fff",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  avatarWrapper: {
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: spacing.xl,
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
    ...typography.bodyLarge,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#fff",
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    width: "100%",
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...typography.button,
    color: "#ff6b6b",
  },
  secondaryButton: {
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: "#fff",
  },
});
