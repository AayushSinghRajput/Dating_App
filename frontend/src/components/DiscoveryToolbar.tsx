import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getPremiumStatus, activateBoost, rewindLastSwipe, PremiumStatus } from "@/utils/api";

export default function DiscoveryToolbar() {
  const { colors } = useTheme();
  const router = useRouter();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [rewinding, setRewinding] = useState(false);
  const [boosting, setBoosting] = useState(false);

  const loadStatus = () => {
    getPremiumStatus()
      .then(setStatus)
      .catch(() => {});
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const goPremium = () => router.push("/screen/PaymentSettings");

  const handleRewind = async () => {
    if (rewinding) return;
    setRewinding(true);
    try {
      await rewindLastSwipe();
      Toast.show({ type: "success", text1: "Last swipe undone" });
    } catch (error: any) {
      if (error.message?.includes("Premium")) {
        Toast.show({
          type: "info",
          text1: "Rewind is a Premium feature",
          text2: "Tap to upgrade",
          onPress: goPremium,
        });
      } else {
        Toast.show({ type: "error", text1: "Couldn't rewind", text2: error.message });
      }
    } finally {
      setRewinding(false);
    }
  };

  const handleBoost = async () => {
    if (boosting) return;
    setBoosting(true);
    try {
      await activateBoost();
      Toast.show({ type: "success", text1: "Boost activated!", text2: "You're getting priority visibility for 30 minutes." });
      loadStatus();
    } catch (error: any) {
      if (error.message?.includes("Premium")) {
        Toast.show({
          type: "info",
          text1: "Boost is a Premium feature",
          text2: "Tap to upgrade",
          onPress: goPremium,
        });
      } else {
        Toast.show({ type: "error", text1: "Couldn't boost", text2: error.message });
      }
    } finally {
      setBoosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleRewind}
        disabled={rewinding}
      >
        {rewinding ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Ionicons name="arrow-undo-circle-outline" size={20} color={colors.textSecondary} />
        )}
        <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Rewind</Text>
        {!status?.isPremium && (
          <Ionicons name="lock-closed" size={11} color={colors.textTertiary} style={styles.lockIcon} />
        )}
      </Pressable>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: status?.boostActive ? colors.accentSoft : colors.surface, borderColor: colors.border },
        ]}
        onPress={handleBoost}
        disabled={boosting || status?.boostActive}
      >
        {boosting ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="rocket-outline" size={20} color={colors.accent} />
        )}
        <Text style={[styles.buttonText, { color: colors.accent }]}>
          {status?.boostActive ? "Boosted" : "Boost"}
        </Text>
        {!status?.isPremium && (
          <Ionicons name="lock-closed" size={11} color={colors.textTertiary} style={styles.lockIcon} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonText: { fontSize: 13, fontWeight: "600" },
  lockIcon: { marginLeft: 2 },
});
