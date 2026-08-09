import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getPremiumStatus,
  initiateEsewaPayment,
  initiateKhaltiPayment,
  PremiumStatus,
} from "@/utils/api";

const PLAN_PRICE_NPR = 500;

const FEATURES = [
  "Unlimited likes",
  "5 Super Likes per day",
  "1 profile Boost per day",
  "Rewind your last swipe",
];

export default function PaymentSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [payingWith, setPayingWith] = useState<"esewa" | "khalti" | null>(null);

  const loadStatus = () => {
    return getPremiumStatus()
      .then(setStatus)
      .catch((error: any) => {
        Toast.show({ type: "error", text1: "Failed to load subscription status", text2: error.message });
      });
  };

  useEffect(() => {
    loadStatus().finally(() => setLoading(false));
  }, []);

  const handleBack = () => router.back();

  const handlePay = async (provider: "esewa" | "khalti") => {
    if (payingWith) return;
    setPayingWith(provider);
    try {
      const redirectUrl = Linking.createURL("payment-result");
      const { url } =
        provider === "esewa"
          ? { url: (await initiateEsewaPayment()).formUrl }
          : { url: (await initiateKhaltiPayment()).paymentUrl };

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === "success" && result.url) {
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.status === "success") {
          Toast.show({ type: "success", text1: "You're Premium!", text2: "Enjoy unlimited likes, Super Likes, and more." });
          await loadStatus();
        } else {
          Toast.show({ type: "error", text1: "Payment didn't complete", text2: "Please try again." });
        }
      } else if (result.type !== "cancel" && result.type !== "dismiss") {
        Toast.show({ type: "error", text1: "Payment didn't complete" });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't start payment", text2: error.message });
    } finally {
      setPayingWith(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Premium</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {status?.isPremium ? (
            <View style={[styles.activeCard, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
              <Ionicons name="diamond" size={32} color={colors.accent} />
              <Text style={[styles.activeTitle, { color: colors.text }]}>You're Premium</Text>
              <Text style={[styles.activeSubtitle, { color: colors.textSecondary }]}>
                Active until {formatDate(status.premiumExpiresAt)}
              </Text>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Ionicons name="diamond-outline" size={32} color={colors.accent} />
              <Text style={[styles.planName, { color: colors.text }]}>Premium Monthly</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: colors.accent }]}>Rs {PLAN_PRICE_NPR}</Text>
                <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/month</Text>
              </View>

              <View style={styles.featuresList}>
                {FEATURES.map((feature) => (
                  <View key={feature} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[styles.payButton, { backgroundColor: "#60BB46" }]}
                onPress={() => handlePay("esewa")}
                disabled={!!payingWith}
              >
                {payingWith === "esewa" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Pay with eSewa</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.payButton, { backgroundColor: "#5C2D91" }]}
                onPress={() => handlePay("khalti")}
                disabled={!!payingWith}
              >
                {payingWith === "khalti" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Pay with Khalti</Text>
                )}
              </Pressable>
            </View>
          )}

          {status && !status.isPremium && (
            <View style={[styles.usageCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Text style={[styles.usageTitle, { color: colors.text }]}>Today's Free Usage</Text>
              <Text style={[styles.usageText, { color: colors.textSecondary }]}>
                {status.likesRemaining} of your free likes remaining
              </Text>
              <Text style={[styles.usageText, { color: colors.textSecondary }]}>
                {status.superLikesRemaining} Super Like{status.superLikesRemaining === 1 ? "" : "s"} remaining
              </Text>
            </View>
          )}
        </ScrollView>
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
  content: { padding: 20, paddingBottom: 40 },
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
  planName: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8, marginBottom: 20 },
  price: { fontSize: 32, fontWeight: "800" },
  pricePeriod: { fontSize: 14, marginBottom: 6, marginLeft: 4 },
  featuresList: { alignSelf: "stretch", marginBottom: 24 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  featureText: { fontSize: 14, flex: 1 },
  payButton: {
    alignSelf: "stretch",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  payButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  activeCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  activeTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  activeSubtitle: { fontSize: 14, marginTop: 4 },
  usageCard: {
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  usageTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  usageText: { fontSize: 13, marginBottom: 4 },
});
