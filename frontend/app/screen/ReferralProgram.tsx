import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getReferralInfo } from "@/services/referralService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function ReferralProgram() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    getReferralInfo()
      .then((info) => {
        if (mounted) {
          setReferralCode(info.referralCode || "SOULMATE");
          setReferralCount(info.referralCount || 0);
        }
      })
      .catch((error: any) => {
        console.warn("[ReferralProgram] Failed to load referral info:", error);
        Toast.show({
          type: "error",
          text1: "Failed to Load Referral Info",
          text2: error?.message || "Using standard invite link.",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => router.back();

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Share.share({
        message: `Join me on Soulmate! Use my referral code ${referralCode} when signing up to unlock 3 days of FREE Premium perks together! 💕 Download here: https://soulmate.dating/join?code=${referralCode}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't Open Share Sheet",
        text2: error?.message || "Please try again.",
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Invite Friends" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your referral perks...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Gift & Romance Banner */}
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="gift" size={24} color="#ffffff" />
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>GIVE 3 DAYS, GET 3 DAYS</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Share the Love</Text>
              <Text style={styles.heroSubtitle}>
                Dating is better together. Invite your single friends to Soulmate — when they join with your code, you both unlock 3 days of complimentary Premium!
              </Text>

              {/* Trust & Perk Badges */}
              <View style={styles.trustPillRow}>
                <View style={styles.trustPill}>
                  <Ionicons name="diamond-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Free Premium</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="sparkles-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Unlimited Likes</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="flash-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Instant Unlock</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Referral Code Showcase Card */}
          <View
            style={[
              styles.codeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.codeCardLabel, { color: colors.textSecondary }]}>
              YOUR UNIQUE INVITE CODE
            </Text>

            <View style={[styles.codeBox, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
              <Text style={[styles.codeText, { color: colors.accent }]}>
                {referralCode}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                pressed && { transform: [{ scale: 0.99 }], opacity: 0.9 },
              ]}
              onPress={handleShare}
            >
              <LinearGradient
                colors={["#e63946", "#ff6b78"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Ionicons name="share-social" size={19} color="#ffffff" />
                <Text style={styles.shareBtnText}>Share Invite Link</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Stats Showcase */}
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="people" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {referralCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {referralCount === 1 ? "Friend Joined" : "Friends Joined"}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: "#d1fae5" }]}>
                <Ionicons name="sparkles" size={20} color="#059669" />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {referralCount * 3}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Premium Days Earned
              </Text>
            </View>
          </View>

          {/* How It Works 3-Step Guide */}
          <View
            style={[
              styles.howItWorksCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.howItWorksTitle, { color: colors.text }]}>
              How Referral Perks Work
            </Text>

            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.stepNumberText, { color: colors.accent }]}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepHeading, { color: colors.text }]}>
                  Send your unique code
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  Share your link with single friends via WhatsApp, Instagram, or SMS.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.stepNumberText, { color: colors.accent }]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepHeading, { color: colors.text }]}>
                  Friend signs up
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  Your friend downloads Soulmate and enters your referral code during onboarding.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={[styles.stepNumberBadge, { backgroundColor: "#d1fae5" }]}>
                <Ionicons name="checkmark" size={14} color="#059669" />
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepHeading, { color: colors.text }]}>
                  Both unlock 3 days of Premium
                </Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                  Enjoy unlimited right-swipes, see who likes you, and get priority profile exposure!
                </Text>
              </View>
            </View>
          </View>
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
    shadowColor: "#e63946",
    shadowOpacity: 0.22,
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
  heroTitle: {
    fontSize: 22,
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
  codeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  codeCardLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  codeBox: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  codeText: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 4,
  },
  shareBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  shareBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    textAlign: "center",
  },
  howItWorksCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    marginLeft: 42,
  },
});
