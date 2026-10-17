import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from "@/services/notificationService";
import DetailHeader from "@/src/components/ui/DetailHeader";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  like: true,
  super_like: true,
  match: true,
  missed_call: true,
  favorite: true,
};

export default function NotificationSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pauseAll, setPauseAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    getNotificationPreferences()
      .then((prefs) => {
        if (mounted && prefs) {
          setPreferences({
            like: prefs.like ?? true,
            super_like: prefs.super_like ?? true,
            match: prefs.match ?? true,
            missed_call: prefs.missed_call ?? true,
            favorite: prefs.favorite ?? true,
          });
        }
      })
      .catch((error) => {
        console.warn("[NotificationSettings] Failed to load preferences:", error);
        Toast.show({
          type: "error",
          text1: "Failed to Load Preferences",
          text2: error?.message || "Using default settings.",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleToggle = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const previous = preferences;
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);

    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (error: any) {
      setPreferences(previous);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not save preference.",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleTogglePauseAll = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPauseAll(val);
    Toast.show({
      type: val ? "info" : "success",
      text1: val ? "All Notifications Paused" : "Notifications Resumed",
      text2: val
        ? "You will not receive alert pings while paused."
        : "Your alert preferences are active again.",
    });
  };

  const handleOpenDeviceSettings = () => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openSettings().catch(() => {
      Toast.show({
        type: "error",
        text1: "Cannot Open Settings",
        text2: "Please open your phone Settings manually.",
      });
    });
  };

  const renderOptionRow = ({
    title,
    description,
    prefKey,
    icon,
    iconColor,
    iconBg,
  }: {
    title: string;
    description: string;
    prefKey: keyof NotificationPreferences;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
  }) => {
    const isEnabled = preferences[prefKey] ?? true;
    const isSaving = savingKey === prefKey;
    const effectiveEnabled = pauseAll ? false : isEnabled;

    return (
      <View
        style={[
          styles.optionRow,
          { borderBottomColor: colors.border },
          pauseAll && { opacity: 0.55 },
        ]}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>
              {title}
            </Text>
            <Text
              style={[styles.optionDesc, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>
        </View>

        {isSaving ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Switch
            value={effectiveEnabled}
            disabled={pauseAll}
            onValueChange={(val) => handleToggle(prefKey, val)}
            trackColor={{ false: colors.border, true: "#e63946" }}
            thumbColor="#ffffff"
            ios_backgroundColor={colors.border}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Notifications" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notification settings...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Romance Alerts Banner */}
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="notifications" size={24} color="#ffffff" />
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>REAL-TIME ALERTS</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Never Miss a Connection</Text>
              <Text style={styles.heroSubtitle}>
                Control how and when Soulmate alerts you about new matches, likes, messages, and calls.
              </Text>

              {/* Trust Pills */}
              <View style={styles.trustPillRow}>
                <View style={styles.trustPill}>
                  <Ionicons name="flash-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Instant Delivery</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="sparkles-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Priority Matches</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Zero Spam</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Master "Pause All" Card */}
          <View
            style={[
              styles.pauseCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: pauseAll ? "#fef3c7" : colors.surfaceAlt },
                ]}
              >
                <Ionicons
                  name={pauseAll ? "moon" : "moon-outline"}
                  size={20}
                  color={pauseAll ? "#d97706" : colors.textSecondary}
                />
              </View>
              <View style={styles.textWrap}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Pause All Notifications
                  </Text>
                  {pauseAll && (
                    <View style={styles.pausedBadge}>
                      <Text style={styles.pausedBadgeText}>MUTED</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Temporarily silence all incoming push notifications for focus or dates
                </Text>
              </View>
            </View>

            <Switch
              value={pauseAll}
              onValueChange={handleTogglePauseAll}
              trackColor={{ false: colors.border, true: "#f59e0b" }}
              thumbColor="#ffffff"
              ios_backgroundColor={colors.border}
            />
          </View>

          {/* Section 1: Matches & Chemistry */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Matches & Chemistry
            </Text>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
              The most exciting alerts to help you spark timely conversations
            </Text>

            <View
              style={[
                styles.cardGroup,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {renderOptionRow({
                title: "New Mutual Matches",
                description: "Get notified immediately when someone you liked likes you back",
                prefKey: "match",
                icon: "sparkles",
                iconColor: "#10b981",
                iconBg: "rgba(16, 185, 129, 0.12)",
              })}

              {renderOptionRow({
                title: "Super Likes",
                description: "Be alerted when someone sends you a standout Super Like",
                prefKey: "super_like",
                icon: "flash",
                iconColor: "#0284c7",
                iconBg: "rgba(2, 132, 199, 0.12)",
              })}

              {renderOptionRow({
                title: "Likes Received",
                description: "Know when new people are interested in viewing your profile",
                prefKey: "like",
                icon: "heart",
                iconColor: "#e63946",
                iconBg: "rgba(230, 57, 70, 0.12)",
              })}
            </View>
          </View>

          {/* Section 2: Calls & Social Activity */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Calls & Social Activity
            </Text>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
              Stay updated on calls and profile activity
            </Text>

            <View
              style={[
                styles.cardGroup,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {renderOptionRow({
                title: "Missed Voice & Video Calls",
                description: "Get notified if a match tries calling you while you are away",
                prefKey: "missed_call",
                icon: "call",
                iconColor: "#ff4b6e",
                iconBg: "rgba(255, 75, 110, 0.12)",
              })}

              {renderOptionRow({
                title: "Favorites & Crushes",
                description: "Alert me when a user saves or bookmarks my dating profile",
                prefKey: "favorite",
                icon: "star",
                iconColor: "#f59e0b",
                iconBg: "rgba(245, 158, 11, 0.12)",
              })}
            </View>
          </View>

          {/* Dating Insight Card */}
          <View
            style={[
              styles.tipCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <View style={styles.tipIconWrap}>
              <Ionicons name="bulb-outline" size={18} color="#e63946" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tipTitle, { color: colors.text }]}>
                Dating Courtesy Tip
              </Text>
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Singles who reply within 15 minutes of receiving a match notification are 3x more likely to go on a successful first date.
              </Text>
            </View>
          </View>

          {/* System OS Permissions Link */}
          <Pressable
            style={({ pressed }) => [
              styles.systemSettingsCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
            onPress={handleOpenDeviceSettings}
          >
            <View style={styles.systemSettingsLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                  Device System Settings
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  Configure sound, banners, and lock-screen alerts in your phone OS
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>

          {/* Footer note */}
          <View style={styles.footerNoteWrap}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>
              Soulmate only delivers notifications related to your direct dating matches and safety. We never spam your notification tray.
            </Text>
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
  pauseCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pausedBadge: {
    backgroundColor: "#fef3c7",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  pausedBadgeText: {
    color: "#d97706",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 16,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(230, 57, 70, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  systemSettingsCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  systemSettingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  footerNoteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 22,
    marginTop: 6,
    gap: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },
});
