import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getReferralInfo } from "@/services/referralService";

export default function ReferralProgram() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    getReferralInfo()
      .then((info) => {
        setReferralCode(info.referralCode);
        setReferralCount(info.referralCount);
      })
      .catch((error: any) => {
        Toast.show({ type: "error", text1: "Failed to load referral info", text2: error.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => router.back();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Soulmate! Use my referral code ${referralCode} when you sign up and we both get free Premium perks. 💕`,
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't open share sheet", text2: error.message });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Invite Friends</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="gift-outline" size={40} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Give 3 days, Get 3 days</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Share your code with friends. When they join using it, you both get 3 days of Premium — free.
            </Text>

            <View style={[styles.codeBox, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
              <Text style={[styles.codeText, { color: colors.accent }]}>{referralCode}</Text>
            </View>

            <Pressable
              style={[styles.shareButton, { backgroundColor: colors.accent }]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Share Invite</Text>
            </Pressable>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{referralCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {referralCount === 1 ? "Friend referred" : "Friends referred"}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20 },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  cardDescription: { fontSize: 14, textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 20 },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 20,
  },
  codeText: { fontSize: 24, fontWeight: "800", letterSpacing: 4 },
  shareButton: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  shareButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  statCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  statValue: { fontSize: 32, fontWeight: "800" },
  statLabel: { fontSize: 13, marginTop: 4 },
});
