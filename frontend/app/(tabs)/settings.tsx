import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { clearToken } from "@/services/apiClient";
import { getProfile, Profile } from "@/services/profileService";
import { getPremiumStatus, PremiumStatus } from "@/services/paymentService";
import Avatar from "@/src/components/ui/Avatar";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import TabSwipeWrapper from "@/src/components/TabSwipeWrapper";

interface SettingItemConfig {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  route?: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  isDestructive?: boolean;
  onPress?: () => void;
}

export default function Settings() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const { t, language, supportedLanguages } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [premium, setPremium] = useState<PremiumStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [prof, prem] = await Promise.all([
        getProfile().catch(() => null),
        getPremiumStatus().catch(() => null),
      ]);
      if (prof) setProfile(prof);
      if (prem) setPremium(prem);
    } catch {
      // Graceful fallback
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t("settings.logoutConfirmTitle", "Log Out"),
      t("settings.logoutConfirmMessage", "Are you sure you want to log out of Soulmate?"),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("settings.logout", "Log Out"),
          style: "destructive",
          onPress: async () => {
            await clearToken();
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  const currentLanguageName =
    supportedLanguages.find((l) => l.code === language)?.name || "English";

  // Section 1: Account & Security
  const accountItems: SettingItemConfig[] = [
    {
      id: "privacy",
      title: t("settings.accountPrivacy", "Account Privacy"),
      subtitle: "Profile visibility, stealth mode & discovery",
      icon: "lock-closed",
      iconColor: "#7c3aed",
      iconBg: "rgba(124, 58, 237, 0.12)",
      route: "/screen/Privacy",
    },
    {
      id: "email",
      title: t("settings.emailVerification", "Email & Verification"),
      subtitle: profile?.user?.email || "Manage your login email",
      icon: "mail",
      iconColor: "#0284c7",
      iconBg: "rgba(2, 132, 199, 0.12)",
      route: "/screen/EmailSettings",
    },
    {
      id: "photo-verification",
      title: t("settings.photoVerification", "Photo Verification"),
      subtitle: profile?.verified ? "Verified profile" : "Get your blue verification badge",
      icon: "shield-checkmark",
      iconColor: "#10b981",
      iconBg: "rgba(16, 185, 129, 0.12)",
      badge: profile?.verified ? "Verified" : "Recommended",
      badgeColor: profile?.verified ? "#065f46" : "#b45309",
      badgeBg: profile?.verified ? "#d1fae5" : "#fef3c7",
      route: "/screen/PhotoVerification",
    },
    {
      id: "password",
      title: t("settings.changePassword", "Change Password"),
      subtitle: "Update password with in-app email code",
      icon: "key",
      iconColor: "#db2777",
      iconBg: "rgba(219, 39, 119, 0.12)",
      route: "/screen/ChangePassword",
    },
    {
      id: "blocked",
      title: t("settings.blockedUsers", "Blocked Users"),
      subtitle: "Manage people you've blocked",
      icon: "ban",
      iconColor: "#64748b",
      iconBg: "rgba(100, 116, 139, 0.12)",
      route: "/screen/BlockedUsers",
    },
  ];

  // Section 2: App Preferences
  const preferenceItems: SettingItemConfig[] = [
    {
      id: "payment",
      title: t("settings.payment", "Payment & Subscriptions"),
      subtitle: premium?.isPremium ? "VIP Member active" : "Upgrade to VIP with eSewa & Khalti",
      icon: "card",
      iconColor: "#d97706",
      iconBg: "rgba(217, 119, 6, 0.12)",
      badge: premium?.isPremium ? "VIP Active" : undefined,
      badgeColor: "#854d0e",
      badgeBg: "#fef9c3",
      route: "/screen/PaymentSettings",
    },
    {
      id: "notifications",
      title: t("settings.notifications", "Notification Settings"),
      subtitle: "Messages, matches & discovery alerts",
      icon: "notifications",
      iconColor: "#e63946",
      iconBg: "rgba(230, 57, 70, 0.12)",
      route: "/screen/NotificationSettings",
    },
    {
      id: "language",
      title: t("settings.language", "App Language"),
      subtitle: "Select your preferred language",
      icon: "language",
      iconColor: "#4f46e5",
      iconBg: "rgba(79, 70, 229, 0.12)",
      badge: currentLanguageName,
      badgeColor: "#3730a3",
      badgeBg: "#e0e7ff",
      route: "/screen/LanguageSettings",
    },
    {
      id: "invite",
      title: t("settings.inviteFriends", "Invite Friends & Earn"),
      subtitle: "Share your code for free Super Likes",
      icon: "gift",
      iconColor: "#c026d3",
      iconBg: "rgba(192, 38, 211, 0.12)",
      badge: "Free Perks",
      badgeColor: "#86198f",
      badgeBg: "#fae8ff",
      route: "/screen/ReferralProgram",
    },
  ];

  // Section 3: Safety & Community
  const safetyItems: SettingItemConfig[] = [
    {
      id: "safety",
      title: t("settings.safetyCenter", "Safety Center"),
      subtitle: "In-person dating safety advice & guidelines",
      icon: "shield-half",
      iconColor: "#0284c7",
      iconBg: "rgba(2, 132, 199, 0.12)",
      route: "/screen/SafetyCenter",
    },
    {
      id: "guidelines",
      title: t("settings.communityGuidelines", "Community Guidelines"),
      subtitle: "Our standards for kindness & respect",
      icon: "heart-circle",
      iconColor: "#e63946",
      iconBg: "rgba(230, 57, 70, 0.12)",
      route: "/screen/CommunityGuidelines",
    },
    {
      id: "privacy-policy",
      title: t("settings.privacyPolicy", "Privacy Policy & Terms"),
      subtitle: "Official policy with PDF download",
      icon: "document-text",
      iconColor: "#64748b",
      iconBg: "rgba(100, 116, 139, 0.12)",
      route: "/screen/PrivacyPolicy",
    },
  ];

  // Section 4: Support & Feedback
  const supportItems: SettingItemConfig[] = [
    {
      id: "help",
      title: t("settings.helpSupport", "Help & Member Care"),
      subtitle: "FAQ, account recovery & live assistance",
      icon: "help-circle",
      iconColor: "#2563eb",
      iconBg: "rgba(37, 99, 235, 0.12)",
      route: "/screen/HelpSupport",
    },
    {
      id: "feedback",
      title: t("settings.feedback", "Send Feedback"),
      subtitle: "Tell us how we can make Soulmate better",
      icon: "chatbox-ellipses",
      iconColor: "#f59e0b",
      iconBg: "rgba(245, 158, 11, 0.12)",
      route: "/screen/FeedbackScreen",
    },
  ];

  // Section 5: Danger Zone
  const dangerItems: SettingItemConfig[] = [
    {
      id: "logout",
      title: t("settings.logout", "Log Out"),
      subtitle: "Safely sign out of this device",
      icon: "exit-outline",
      iconColor: "#e63946",
      iconBg: "rgba(230, 57, 70, 0.12)",
      isDestructive: true,
      onPress: handleLogout,
    },
    {
      id: "delete",
      title: t("settings.deleteAccount", "Delete Account"),
      subtitle: "Permanently erase your dating profile and data",
      icon: "trash-outline",
      iconColor: "#dc2626",
      iconBg: "rgba(220, 38, 38, 0.12)",
      isDestructive: true,
      route: "/screen/DeleteAccount",
    },
  ];

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: "light", label: t("settings.light", "Light"), icon: "sunny-outline" },
    { mode: "dark", label: t("settings.dark", "Dark"), icon: "moon-outline" },
    { mode: "system", label: t("settings.system", "System"), icon: "phone-portrait-outline" },
  ];

  const renderSection = (title: string, items: SettingItemConfig[]) => (
    <View style={styles.sectionContainer} key={title}>
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={item.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.itemRow,
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (item.onPress) {
                    item.onPress();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View style={[styles.itemIconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>

                <View style={styles.itemTextWrap}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: item.isDestructive ? colors.accent : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text
                      style={[styles.itemSubtitle, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  )}
                </View>

                {item.badge && (
                  <View
                    style={[
                      styles.itemBadge,
                      {
                        backgroundColor: item.badgeBg || colors.surfaceAlt,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemBadgeText,
                        { color: item.badgeColor || colors.textSecondary },
                      ]}
                    >
                      {item.badge}
                    </Text>
                  </View>
                )}

                {!item.isDestructive && (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textTertiary}
                    style={styles.chevronIcon}
                  />
                )}
              </Pressable>
              {!isLast && (
                <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );

  return (
    <TabSwipeWrapper rightTab="/(tabs)/chat">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
        title={t("settings.title", "Settings")}
        subtitle={t("settings.subtitle", "Account & App Preferences")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* 1. Profile Hero Card */}
        <Pressable
          style={({ pressed }) => [
            styles.profileHeroCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.94 },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/screen/ProfileEdit");
          }}
        >
          <View style={styles.avatarContainer}>
            <Avatar uri={profile?.profileImage} size="lg" accessibilityLabel="Your profile photo" />
            {profile?.verified && (
              <View style={styles.avatarVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              </View>
            )}
          </View>

          <View style={styles.profileTextContainer}>
            <View style={styles.profileNameRow}>
              <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                {profile?.name || profile?.user?.username || t("settings.yourProfile", "Your Profile")}
                {profile?.age ? `, ${profile.age}` : ""}
              </Text>
            </View>

            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile?.user?.email || profile?.location || "Complete your profile"}
            </Text>

            <View style={styles.profileBadgesRow}>
              {profile?.verified ? (
                <View style={[styles.verifiedPill, { backgroundColor: "#d1fae5" }]}>
                  <Ionicons name="shield-checkmark" size={12} color="#059669" />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.verifiedPill, { backgroundColor: "rgba(245, 158, 11, 0.14)" }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push("/screen/PhotoVerification");
                  }}
                >
                  <Ionicons name="shield-outline" size={12} color="#d97706" />
                  <Text style={[styles.verifiedPillText, { color: "#d97706" }]}>Get Verified</Text>
                </Pressable>
              )}

              {premium?.isPremium ? (
                <View style={[styles.vipPill, { backgroundColor: "#fef3c7" }]}>
                  <Ionicons name="diamond" size={12} color="#d97706" />
                  <Text style={styles.vipPillText}>VIP Member</Text>
                </View>
              ) : (
                <View style={[styles.freePill, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.freePillText, { color: colors.textSecondary }]}>Free Member</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.editProfileBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="pencil" size={16} color={colors.text} />
          </View>
        </Pressable>

        {/* 2. Soulmate VIP Membership Banner */}
        <Pressable
          style={({ pressed }) => [
            styles.vipBannerOuter,
            pressed && { transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/screen/PaymentSettings");
          }}
        >
          {premium?.isPremium ? (
            <LinearGradient
              colors={["#7c3aed", "#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vipBanner}
            >
              <View style={styles.vipBannerContent}>
                <View style={styles.vipBannerLeft}>
                  <View style={styles.vipTag}>
                    <Ionicons name="diamond" size={12} color="#ffffff" />
                    <Text style={styles.vipTagText}>VIP PRIVILEGES ACTIVE</Text>
                  </View>
                  <Text style={styles.vipBannerTitle}>Soulmate VIP Member</Text>
                  <Text style={styles.vipBannerSubtitle}>
                    Enjoying unlimited swipes, daily boost, and 5 Super Likes
                  </Text>
                </View>
                <View style={styles.vipBannerAction}>
                  <Text style={styles.vipActionText}>Manage</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={["#d97706", "#f59e0b", "#e63946"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vipBanner}
            >
              <View style={styles.vipBannerContent}>
                <View style={styles.vipBannerLeft}>
                  <View style={styles.vipTag}>
                    <Ionicons name="sparkles" size={12} color="#ffffff" />
                    <Text style={styles.vipTagText}>SPECIAL UPGRADE</Text>
                  </View>
                  <Text style={styles.vipBannerTitle}>Unlock Soulmate VIP</Text>
                  <Text style={styles.vipBannerSubtitle}>
                    Unlimited Likes • Daily Profile Boost • 5 Super Likes
                  </Text>
                </View>
                <View style={styles.upgradeBtn}>
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </View>
              </View>
            </LinearGradient>
          )}
        </Pressable>

        {/* 3. Section: Account & Security */}
        {renderSection(t("settings.accountSection", "ACCOUNT & SECURITY"), accountItems)}

        {/* 4. Section: App Preferences */}
        {renderSection(t("settings.preferencesSection", "PREFERENCES"), preferenceItems)}

        {/* 5. Section: Appearance */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            {t("settings.appearance", "APPEARANCE")}
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.appearanceCardInner}>
              <View style={styles.appearanceHeaderRow}>
                <View style={[styles.itemIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
                  <Ionicons name="color-palette" size={20} color="#f59e0b" />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {t("settings.themeMode", "Display Theme")}
                  </Text>
                  <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                    {t("settings.themeDesc", "Choose light, dark, or system mode")}
                  </Text>
                </View>
              </View>

              <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceAlt }]}>
                {themeOptions.map((option) => {
                  const isActive = mode === option.mode;
                  return (
                    <Pressable
                      key={option.mode}
                      style={[
                        styles.segment,
                        isActive && [
                          styles.segmentActive,
                          { backgroundColor: colors.accent, shadowColor: colors.shadow },
                        ],
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setMode(option.mode);
                      }}
                    >
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={isActive ? "#ffffff" : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.segmentLabel,
                          { color: isActive ? "#ffffff" : colors.textSecondary },
                          isActive && styles.segmentLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* 6. Section: Safety & Community */}
        {renderSection(t("settings.safetySection", "COMMUNITY & SAFETY"), safetyItems)}

        {/* 7. Section: Support & Feedback */}
        {renderSection(t("settings.supportSection", "SUPPORT & FEEDBACK"), supportItems)}

        {/* 8. Section: Danger Zone (Log Out & Delete) */}
        {renderSection(t("settings.accountActions", "ACCOUNT ACTIONS"), dangerItems)}

        {/* 9. Brand & Version Footer */}
        <View style={styles.brandFooter}>
          <View style={styles.footerBrandRow}>
            <Ionicons name="heart" size={13} color="#e63946" />
            <Text style={[styles.footerBrandName, { color: colors.textSecondary }]}>Soulmate</Text>
            <Text style={[styles.footerDot, { color: colors.textTertiary }]}>•</Text>
            <Text style={[styles.footerVersionText, { color: colors.textTertiary }]}>
              v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
      </View>
    </TabSwipeWrapper>
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
    paddingBottom: 16,
  },

  /* Profile Hero Card */
  profileHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarVerifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
  },
  profileTextContainer: {
    flex: 1,
    gap: 3,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 12.5,
  },
  profileBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  vipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  vipPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#d97706",
  },
  freePill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  freePillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  editProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  /* VIP Banner */
  vipBannerOuter: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#d97706",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  vipBanner: {
    padding: 16,
  },
  vipBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  vipBannerLeft: {
    flex: 1,
    gap: 2,
  },
  vipTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  vipTagText: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  vipBannerTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  vipBannerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    lineHeight: 16,
  },
  vipBannerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  vipActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  upgradeBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeBtnText: {
    color: "#e63946",
    fontSize: 13,
    fontWeight: "800",
  },

  /* Inset Grouped Section */
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 6,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: {
    flex: 1,
    gap: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  itemBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  itemBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  chevronIcon: {
    marginLeft: 2,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },

  /* Appearance Section Inner */
  appearanceCardInner: {
    padding: 14,
    gap: 12,
  },
  appearanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentActive: {
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  segmentLabelActive: {
    fontWeight: "800",
  },

  /* Footer */
  brandFooter: {
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerBrandName: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  footerDot: {
    fontSize: 12,
  },
  footerVersionText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
