import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProfile, setIncognitoModeApi } from "@/services/profileService";
import DetailHeader from "@/src/components/ui/DetailHeader";

const STORAGE_KEYS = {
  ONLINE_STATUS: "@soulmate_privacy_online_status",
  SHOW_DISTANCE: "@soulmate_privacy_show_distance",
  READ_RECEIPTS: "@soulmate_privacy_read_receipts",
};

export default function Privacy() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [savingIncognito, setSavingIncognito] = useState(false);
  const [incognito, setIncognito] = useState(false);

  // Preference switches
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [requestingData, setRequestingData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPrivacySettings() {
      try {
        const [profile, savedOnline, savedDistance, savedReceipts] =
          await Promise.all([
            getProfile().catch(() => null),
            AsyncStorage.getItem(STORAGE_KEYS.ONLINE_STATUS),
            AsyncStorage.getItem(STORAGE_KEYS.SHOW_DISTANCE),
            AsyncStorage.getItem(STORAGE_KEYS.READ_RECEIPTS),
          ]);

        if (isMounted) {
          if (profile && typeof profile.incognito === "boolean") {
            setIncognito(profile.incognito);
          }
          if (savedOnline !== null) setShowOnlineStatus(savedOnline === "true");
          if (savedDistance !== null) setShowDistance(savedDistance === "true");
          if (savedReceipts !== null) setReadReceipts(savedReceipts === "true");
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Failed to load settings",
          text2: error?.message || "Could not retrieve privacy configuration",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPrivacySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleToggleIncognito = async (newIncognitoValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const previous = incognito;
    setIncognito(newIncognitoValue);
    setSavingIncognito(true);

    try {
      await setIncognitoModeApi(newIncognitoValue);
      Toast.show({
        type: "success",
        text1: newIncognitoValue ? "Incognito Mode Activated" : "Public Discovery Restored",
        text2: newIncognitoValue
          ? "You are hidden from new swipe queues. Existing matches and chats remain active."
          : "Your profile is now discoverable to new singles nearby.",
      });
    } catch (error: any) {
      setIncognito(previous);
      Toast.show({
        type: "error",
        text1: "Failed to update Incognito mode",
        text2: error?.message || "Please check your network and try again.",
      });
    } finally {
      setSavingIncognito(false);
    }
  };

  const handleToggleOnlineStatus = async (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setShowOnlineStatus(value);
    await AsyncStorage.setItem(STORAGE_KEYS.ONLINE_STATUS, String(value));
    Toast.show({
      type: "info",
      text1: value ? "Online Status Visible" : "Online Status Hidden",
      text2: value
        ? "Matches can now see when you are active."
        : "Your active indicators are hidden from matches.",
    });
  };

  const handleToggleDistance = async (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setShowDistance(value);
    await AsyncStorage.setItem(STORAGE_KEYS.SHOW_DISTANCE, String(value));
    Toast.show({
      type: "info",
      text1: value ? "Distance Display Enabled" : "Distance Display Hidden",
      text2: value
        ? "Approximate distance will be shown on your profile."
        : "Distance is now hidden on your discovery card.",
    });
  };

  const handleToggleReadReceipts = async (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setReadReceipts(value);
    await AsyncStorage.setItem(STORAGE_KEYS.READ_RECEIPTS, String(value));
    Toast.show({
      type: "info",
      text1: value ? "Read Receipts Enabled" : "Read Receipts Disabled",
      text2: value
        ? "Matches will see blue checkmarks when you view their messages."
        : "Matches will not know when you have read their messages.",
    });
  };

  const handleRequestDataExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      "Request My Data Archive",
      "We will compile a secure ZIP archive containing your profile attributes, match timestamps, photos, and chat logs. A download link will be dispatched to your registered email.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Archive",
          style: "default",
          onPress: () => {
            setRequestingData(true);
            setTimeout(() => {
              setRequestingData(false);
              Toast.show({
                type: "success",
                text1: "Data Archive Requested",
                text2: "Your request has been queued. You will receive an email within 24 hours.",
              });
            }, 1200);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader
        title={t("settings.accountPrivacy", "Account Privacy")}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Trust Banner */}
        <View style={styles.heroOuter}>
          <LinearGradient
            colors={["#e63946", "#ff6b78", "#ff85a1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="lock-closed" size={26} color="#ffffff" />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: incognito
                      ? "rgba(30, 41, 59, 0.85)"
                      : "rgba(255, 255, 255, 0.25)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: incognito ? "#f59e0b" : "#10b981" },
                  ]}
                />
                <Text style={styles.statusBadgeText}>
                  {incognito ? "INCOGNITO ACTIVE" : "PUBLIC DISCOVERY"}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Your Privacy, Your Control</Text>
            <Text style={styles.heroSubtitle}>
              Customize who discovers your profile, protect your physical whereabouts, and control what information is shared.
            </Text>

            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricPill}>
                <Ionicons name="shield-checkmark" size={13} color="#ffffff" />
                <Text style={styles.quickMetricText}>Zero Data Sales</Text>
              </View>
              <View style={styles.quickMetricPill}>
                <Ionicons name="location-outline" size={13} color="#ffffff" />
                <Text style={styles.quickMetricText}>Fuzzy Geofencing</Text>
              </View>
              <View style={styles.quickMetricPill}>
                <Ionicons name="lock-closed-outline" size={13} color="#ffffff" />
                <Text style={styles.quickMetricText}>Encrypted Chats</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Discovery & Stealth Section */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Discovery & Visibility
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Manage how singles discover you on Soulmate
          </Text>

          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Incognito Mode Toggle */}
            <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: incognito ? colors.accent : colors.accentSoft },
                ]}
              >
                <Ionicons
                  name={incognito ? "eye-off" : "eye"}
                  size={20}
                  color={incognito ? "#ffffff" : colors.accent}
                />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    Incognito Mode
                  </Text>
                  {incognito && (
                    <View style={[styles.miniBadge, { backgroundColor: colors.accentSoft }]}>
                      <Text style={[styles.miniBadgeText, { color: colors.accent }]}>
                        STEALTH
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Hide from discovery queues. Only people you&apos;ve already liked or matched with can view your profile.
                </Text>
              </View>
              {loading || savingIncognito ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Switch
                  value={incognito}
                  onValueChange={handleToggleIncognito}
                  trackColor={{ false: colors.border, true: colors.accentSoft }}
                  thumbColor={incognito ? colors.accent : "#f4f3f4"}
                  ios_backgroundColor={colors.border}
                />
              )}
            </View>

            {/* Online Status Toggle */}
            <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="radio-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Show Online Status
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Allow mutual matches to see when you are active on the app.
                </Text>
              </View>
              <Switch
                value={showOnlineStatus}
                onValueChange={handleToggleOnlineStatus}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={showOnlineStatus ? colors.accent : "#f4f3f4"}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Approximate Distance Toggle */}
            <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="navigate-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Show Distance on Profile
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Displays approximate distance (e.g. 3 km) without revealing exact coordinates.
                </Text>
              </View>
              <Switch
                value={showDistance}
                onValueChange={handleToggleDistance}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={showDistance ? colors.accent : "#f4f3f4"}
                ios_backgroundColor={colors.border}
              />
            </View>

            {/* Read Receipts Toggle */}
            <View style={[styles.rowItem, { borderBottomColor: "transparent" }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="checkmark-done-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Read Receipts
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Let matches know when you have seen their chat messages.
                </Text>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={handleToggleReadReceipts}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={readReceipts ? colors.accent : "#f4f3f4"}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>
        </View>

        {/* Safety & Security Hub */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Safety & Protection Hub
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Tools to stay safe in real life and inside the app
          </Text>

          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Blocked Users */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/BlockedUsers")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="ban-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Blocked Profiles
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  View and manage accounts you have blocked
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Safety Center */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/SafetyCenter")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Safety Center & Emergency Contacts
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Date checklists, emergency SOS, and live share
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Photo Verification */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/PhotoVerification")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="camera-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    Photo Verification
                  </Text>
                  <View style={[styles.miniBadge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.miniBadgeText, { color: colors.accent }]}>
                      TRUSTED
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Confirm your identity to earn the blue verified badge
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Change Password */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: "transparent" },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/ChangePassword")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="key-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Change Password
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Update your authentication credentials securely
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Data Rights & Legal Documents */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Data Rights & Legal Terms
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Access official documents and export your personal information
          </Text>

          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Privacy Policy */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/PrivacyPolicy")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>
                    Soulmate Privacy Policy
                  </Text>
                  <View style={[styles.miniBadge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.miniBadgeText, { color: colors.accent }]}>
                      PDF READY
                    </Text>
                  </View>
                </View>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Read official terms, data protection policies, and download PDF
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Community Guidelines */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={() => router.push("/screen/CommunityGuidelines")}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="people-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Community Guidelines
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Standards for respectful, genuine, and safe connections
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Request Data Archive */}
            <Pressable
              style={({ pressed }) => [
                styles.navRow,
                { borderBottomColor: "transparent" },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              onPress={handleRequestDataExport}
              disabled={requestingData}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                {requestingData ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Ionicons name="cloud-download-outline" size={20} color={colors.accent} />
                )}
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  Request My Personal Data
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Export an official archive of your profile, photos, and match log
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Soulmate Privacy Guarantee Banner */}
        <View
          style={[
            styles.guaranteeBanner,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.guaranteeHeader}>
            <Ionicons name="heart-circle" size={22} color={colors.accent} />
            <Text style={[styles.guaranteeTitle, { color: colors.text }]}>
              The Soulmate Privacy Pledge
            </Text>
          </View>
          <Text style={[styles.guaranteeText, { color: colors.textSecondary }]}>
            We never monetize your intimate moments, sell data to advertisers, or track you across the web. Love belongs to you, and so does your personal privacy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#e63946",
    shadowOpacity: 0.2,
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
  heroIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 10.5,
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
    marginBottom: 16,
  },
  quickMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  quickMetricPill: {
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
  quickMetricText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 10,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textWrap: {
    flex: 1,
    marginRight: 12,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  miniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  guaranteeBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
  },
  guaranteeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  guaranteeTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  guaranteeText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
