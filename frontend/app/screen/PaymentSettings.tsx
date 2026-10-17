import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getPremiumStatus,
  initiateEsewaPayment,
  initiateKhaltiPayment,
  activateBoost,
  PremiumStatus,
} from "@/services/paymentService";
import DetailHeader from "@/src/components/ui/DetailHeader";

const PLAN_PRICE_NPR = 500;

interface VipBenefit {
  id: string;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const VIP_BENEFITS: VipBenefit[] = [
  {
    id: "likes",
    title: "Unlimited Right Swipes",
    desc: "Like as many profiles as you want with zero daily limits",
    icon: "infinite",
    color: "#e63946",
  },
  {
    id: "super_likes",
    title: "5 Free Super Likes Daily",
    desc: "Stand out with a glowing badge and notification on their feed",
    icon: "flash",
    color: "#0284c7",
  },
  {
    id: "boost",
    title: "1 Daily Profile Boost",
    desc: "Be the top profile in your area for 30 mins (up to 10x views)",
    icon: "rocket",
    color: "#8b5cf6",
  },
  {
    id: "rewind",
    title: "Unlimited Rewinds",
    desc: "Accidentally swiped left? Take it back anytime with one tap",
    icon: "arrow-undo",
    color: "#f59e0b",
  },
  {
    id: "ads",
    title: "Zero Ads & Interruptions",
    desc: "Pure, uninterrupted dating focused purely on chemistry",
    icon: "shield-checkmark",
    color: "#10b981",
  },
];

export default function PaymentSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [payingWith, setPayingWith] = useState<"esewa" | "khalti" | null>(null);
  const [boosting, setBoosting] = useState(false);

  const loadStatus = async () => {
    try {
      const data = await getPremiumStatus();
      setStatus(data);
    } catch (error: any) {
      console.warn("[PaymentSettings] Failed to load premium status:", error);
      Toast.show({
        type: "error",
        text1: "Failed to Load Subscription",
        text2: error?.message || "Please check your network connection.",
      });
    }
  };

  useEffect(() => {
    loadStatus().finally(() => setLoading(false));
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handlePay = async (provider: "esewa" | "khalti") => {
    if (payingWith) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          Toast.show({
            type: "success",
            text1: "Welcome to Soulmate VIP!",
            text2: "Enjoy unlimited likes, daily boosts, and priority exposure.",
          });
          await loadStatus();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          Toast.show({
            type: "error",
            text1: "Payment Incomplete",
            text2: "Your payment was not finished. Please try again.",
          });
        }
      } else if (result.type !== "cancel" && result.type !== "dismiss") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({
          type: "error",
          text1: "Payment Canceled",
          text2: "The payment session was closed.",
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Payment Failed to Start",
        text2: error?.message || "Please check your internet connection.",
      });
    } finally {
      setPayingWith(null);
    }
  };

  const handleActivateBoost = async () => {
    if (boosting || status?.boostActive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setBoosting(true);

    try {
      await activateBoost();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Boost Activated! 🚀",
        text2: "Your profile is now prioritized across discovery for 30 minutes.",
      });
      await loadStatus();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Could Not Activate Boost",
        text2: error?.message || "Please try again later.",
      });
    } finally {
      setBoosting(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Ongoing";
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Premium & Subscriptions" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking your VIP membership...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {status?.isPremium ? (
            /* 1. ACTIVE VIP MEMBER STATE */
            <View>
              {/* VIP Member Hero Banner */}
              <View style={styles.heroOuter}>
                <LinearGradient
                  colors={["#b45309", "#d97706", "#e63946"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroBadge}>
                      <Ionicons name="diamond" size={24} color="#ffffff" />
                    </View>
                    <View style={styles.vipPill}>
                      <Text style={styles.vipPillText}>SOULMATE VIP ACTIVE</Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>You&apos;re a Soulmate VIP</Text>
                  <Text style={styles.heroSubtitle}>
                    All premium superpowers are fully unlocked. You enjoy priority match placement, unlimited likes, and instant boosts.
                  </Text>

                  <View style={styles.expiryBadge}>
                    <Ionicons name="time-outline" size={14} color="#ffffff" />
                    <Text style={styles.expiryText}>
                      Active until {formatDate(status.premiumExpiresAt)}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Boost Feature Card for VIPs */}
              <View
                style={[
                  styles.boostCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.boostTopRow}>
                  <View style={[styles.boostIconWrap, { backgroundColor: "#ede9fe" }]}>
                    <Ionicons name="rocket" size={24} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.boostTitle, { color: colors.text }]}>
                      Daily Profile Boost
                    </Text>
                    <Text style={[styles.boostDesc, { color: colors.textSecondary }]}>
                      {status.boostActive
                        ? "Your boost is currently active! Dating profiles are viewing you first."
                        : "Ready to be the top profile in your area for 30 minutes?"}
                    </Text>
                  </View>
                </View>

                {status.boostActive ? (
                  <View style={styles.activeBoostBadge}>
                    <Ionicons name="flash" size={16} color="#10b981" />
                    <Text style={styles.activeBoostText}>
                      BOOST ACTIVE NOW
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.activateBoostBtn,
                      boosting && { opacity: 0.6 },
                      pressed && !boosting && { transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={handleActivateBoost}
                    disabled={boosting}
                  >
                    <LinearGradient
                      colors={["#8b5cf6", "#a855f7"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.boostGradient}
                    >
                      {boosting ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.boostBtnText}>Activating...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="rocket-outline" size={18} color="#ffffff" />
                          <Text style={styles.boostBtnText}>
                            Activate Daily Boost (30 mins)
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </View>

              {/* Active VIP Superpowers List */}
              <View
                style={[
                  styles.perksCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.perksHeading, { color: colors.text }]}>
                  Active VIP Privileges
                </Text>

                {VIP_BENEFITS.map((benefit) => (
                  <View key={benefit.id} style={styles.perkRow}>
                    <View style={[styles.perkIconBox, { backgroundColor: `${benefit.color}15` }]}>
                      <Ionicons name={benefit.icon} size={20} color={benefit.color} />
                    </View>
                    <View style={styles.perkTextWrap}>
                      <Text style={[styles.perkTitle, { color: colors.text }]}>
                        {benefit.title}
                      </Text>
                      <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>
                        {benefit.desc}
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  </View>
                ))}
              </View>

              {/* Extend / Renew Section */}
              <View style={styles.extendSection}>
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Extend Your Membership
                </Text>
                <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
                  Add another 30 days to your VIP access anytime
                </Text>

                <View style={styles.paymentButtonRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.gatewayBtn,
                      styles.esewaBtn,
                      payingWith === "esewa" && { opacity: 0.6 },
                      pressed && !payingWith && { transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handlePay("esewa")}
                    disabled={!!payingWith}
                  >
                    {payingWith === "esewa" ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.gatewayContent}>
                        <View style={styles.esewaLogoBadge}>
                          <Image
                            source={require("../../assets/images/esewa-logo.png")}
                            style={styles.gatewayEsewaLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.gatewayBtnText}>Pay via eSewa</Text>
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.gatewayBtn,
                      styles.khaltiBtn,
                      payingWith === "khalti" && { opacity: 0.6 },
                      pressed && !payingWith && { transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handlePay("khalti")}
                    disabled={!!payingWith}
                  >
                    {payingWith === "khalti" ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.gatewayContent}>
                        <View style={styles.khaltiLogoBadge}>
                          <Image
                            source={require("../../assets/images/khalti-logo.png")}
                            style={styles.gatewayKhaltiLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.gatewayBtnText}>Pay via Khalti</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            /* 2. FREE MEMBER UPGRADE FLOW */
            <View>
              {/* Premium Teaser Hero Banner */}
              <View style={styles.heroOuter}>
                <LinearGradient
                  colors={["#d97706", "#f59e0b", "#e63946"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroCard}
                >
                  <View style={styles.heroTopRow}>
                    <View style={styles.heroBadge}>
                      <Ionicons name="diamond" size={24} color="#ffffff" />
                    </View>
                    <View style={styles.heroPill}>
                      <Text style={styles.heroPillText}>SOULMATE VIP PASS</Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>Unlock Your Love Life</Text>
                  <Text style={styles.heroSubtitle}>
                    Get up to 4x more sparks! Enjoy unlimited right-swipes, daily boosts to reach top profiles, and 5 Super Likes every day.
                  </Text>

                  {/* Trust Pills */}
                  <View style={styles.trustPillRow}>
                    <View style={styles.trustPill}>
                      <Ionicons name="infinite-outline" size={13} color="#ffffff" />
                      <Text style={styles.trustPillText}>Unlimited Swipes</Text>
                    </View>
                    <View style={styles.trustPill}>
                      <Ionicons name="flash-outline" size={13} color="#ffffff" />
                      <Text style={styles.trustPillText}>5 Super Likes/Day</Text>
                    </View>
                    <View style={styles.trustPill}>
                      <Ionicons name="rocket-outline" size={13} color="#ffffff" />
                      <Text style={styles.trustPillText}>1 Daily Boost</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Free Usage Progress Card */}
              {status && (
                <View
                  style={[
                    styles.usageCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.usageHeaderRow}>
                    <Text style={[styles.usageHeading, { color: colors.text }]}>
                      Today&apos;s Free Quota
                    </Text>
                    <Text style={[styles.usageResetNotice, { color: colors.textSecondary }]}>
                      Resets midnight
                    </Text>
                  </View>

                  <View style={styles.usagePillGrid}>
                    <View
                      style={[
                        styles.quotaBox,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.quotaHeaderRow}>
                        <View style={[styles.quotaIconWrap, { backgroundColor: "rgba(230, 57, 70, 0.12)" }]}>
                          <Ionicons name="heart" size={16} color="#e63946" />
                        </View>
                        <Text style={[styles.quotaNumber, { color: colors.text }]}>
                          {status.likesRemaining ?? 0}
                        </Text>
                      </View>
                      <Text
                        style={[styles.quotaLabel, { color: colors.textSecondary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Likes Remaining
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.quotaBox,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.quotaHeaderRow}>
                        <View style={[styles.quotaIconWrap, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                          <Ionicons name="flash" size={16} color="#0284c7" />
                        </View>
                        <Text style={[styles.quotaNumber, { color: colors.text }]}>
                          {status.superLikesRemaining ?? 0}
                        </Text>
                      </View>
                      <Text
                        style={[styles.quotaLabel, { color: colors.textSecondary }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Super Likes Left
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Plan Pricing & Perks Card */}
              <View
                style={[
                  styles.planCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.planHeaderTag}>
                  <Text style={styles.planTagText}>MOST POPULAR VIP CHOICE</Text>
                </View>

                <View style={styles.planTop}>
                  <View style={styles.planHeaderLeft}>
                    <Text
                      style={[styles.planTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      VIP Monthly Membership
                    </Text>
                    <Text
                      style={[styles.planSubtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      30 days of complete dating freedom
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <View style={styles.priceAmountRow}>
                      <Text style={[styles.priceCurrency, { color: colors.accent }]}>
                        Rs.
                      </Text>
                      <Text style={[styles.priceAmount, { color: colors.accent }]}>
                        {PLAN_PRICE_NPR}
                      </Text>
                    </View>
                    <Text style={[styles.priceDuration, { color: colors.textSecondary }]}>
                      / month
                    </Text>
                  </View>
                </View>

                {/* VIP Perks List */}
                <View style={styles.benefitsList}>
                  {VIP_BENEFITS.map((b) => (
                    <View key={b.id} style={styles.benefitRow}>
                      <View style={[styles.benefitIconWrap, { backgroundColor: `${b.color}15` }]}>
                        <Ionicons name={b.icon} size={18} color={b.color} />
                      </View>
                      <View style={styles.benefitTextWrap}>
                        <Text style={[styles.benefitName, { color: colors.text }]}>
                          {b.title}
                        </Text>
                        <Text style={[styles.benefitDesc, { color: colors.textSecondary }]}>
                          {b.desc}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                    </View>
                  ))}
                </View>

                {/* Payment Gateway Options */}
                <View style={styles.gatewaySection}>
                  <Text style={[styles.gatewayHeading, { color: colors.text }]}>
                    Select Payment Method:
                  </Text>

                  {/* eSewa */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.gatewayBtn,
                      styles.esewaBtn,
                      payingWith === "esewa" && { opacity: 0.6 },
                      pressed && !payingWith && { transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handlePay("esewa")}
                    disabled={!!payingWith}
                  >
                    {payingWith === "esewa" ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.gatewayContent}>
                        <View style={styles.esewaLogoBadge}>
                          <Image
                            source={require("../../assets/images/esewa-logo.png")}
                            style={styles.gatewayEsewaLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.gatewayBtnText}>Pay via eSewa</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Khalti */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.gatewayBtn,
                      styles.khaltiBtn,
                      payingWith === "khalti" && { opacity: 0.6 },
                      pressed && !payingWith && { transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => handlePay("khalti")}
                    disabled={!!payingWith}
                  >
                    {payingWith === "khalti" ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.gatewayContent}>
                        <View style={styles.khaltiLogoBadge}>
                          <Image
                            source={require("../../assets/images/khalti-logo.png")}
                            style={styles.gatewayKhaltiLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.gatewayBtnText}>Pay via Khalti</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#d97706",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  vipPill: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  vipPillText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 19,
    marginBottom: 14,
  },
  trustPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  trustPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  expiryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  boostCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  boostTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  boostIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  boostTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  boostDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  activeBoostBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#d1fae5",
    paddingVertical: 12,
    borderRadius: 14,
  },
  activeBoostText: {
    color: "#065f46",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  activateBoostBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  boostGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  boostBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  perksCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  perksHeading: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  perkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  perkTextWrap: {
    flex: 1,
    gap: 2,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  perkDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  extendSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 12,
  },
  paymentButtonRow: {
    gap: 10,
  },
  usageCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  usageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usageHeading: {
    fontSize: 14,
    fontWeight: "800",
  },
  usageResetNotice: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  usagePillGrid: {
    flexDirection: "row",
    gap: 10,
  },
  quotaBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  quotaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quotaIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  quotaNumber: {
    fontSize: 19,
    fontWeight: "900",
  },
  quotaLabel: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  planHeaderTag: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: "#e63946",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  planTagText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
    paddingBottom: 14,
    gap: 8,
  },
  planHeaderLeft: {
    flex: 1,
    paddingRight: 6,
  },
  planTitle: {
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  planSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  priceAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: "800",
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
  },
  priceDuration: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  benefitsList: {
    gap: 14,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTextWrap: {
    flex: 1,
    gap: 1,
  },
  benefitName: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  benefitDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  gatewaySection: {
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
    paddingTop: 16,
  },
  gatewayHeading: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  gatewayBtn: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  esewaBtn: {
    backgroundColor: "#60bb46",
  },
  khaltiBtn: {
    backgroundColor: "#5c2d91",
  },
  gatewayContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  esewaLogoBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 30,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  khaltiLogoBadge: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 30,
    minWidth: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  gatewayEsewaLogo: {
    width: 66,
    height: 18,
  },
  gatewayKhaltiLogo: {
    width: 48,
    height: 19,
  },
  gatewayBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
