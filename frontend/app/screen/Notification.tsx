import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { AppNotification } from "@/services/notificationService";
import { createOrGetChat } from "@/services/chatService";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffMs / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

interface NotificationDetails {
  user: string;
  actionText: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeBg: string;
  actionButtonLabel: string;
  actionButtonType: "primary" | "secondary" | "outline";
}

function getNotificationDetails(item: AppNotification): NotificationDetails {
  const user = item.fromUser?.username || "Someone";
  switch (item.type) {
    case "match":
      return {
        user,
        actionText: "matched with you! Send a message to break the ice.",
        icon: "sparkles",
        badgeBg: "#10b981", // vibrant emerald
        actionButtonLabel: "Message",
        actionButtonType: "primary",
      };
    case "like":
      return {
        user,
        actionText: "liked your profile. Tap to see who's interested in you.",
        icon: "heart",
        badgeBg: "#e63946", // brand crimson
        actionButtonLabel: "View",
        actionButtonType: "outline",
      };
    case "missed_call":
      return {
        user,
        actionText: `called you (Missed ${item.callType === "video" ? "video" : "audio"} call).`,
        icon: item.callType === "video" ? "videocam" : "call",
        badgeBg: "#ff4b6e",
        actionButtonLabel: "Call back",
        actionButtonType: "secondary",
      };
    case "favorite":
      return {
        user,
        actionText: "added you to their favorites list.",
        icon: "star",
        badgeBg: "#f59e0b", // warm amber
        actionButtonLabel: "View",
        actionButtonType: "outline",
      };
    default:
      return {
        user,
        actionText: "sent you a notification.",
        icon: "notifications",
        badgeBg: "#6b7280",
        actionButtonLabel: "View",
        actionButtonType: "outline",
      };
  }
}

interface NotificationSection {
  title: string;
  data: AppNotification[];
}

export default function NotificationScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const { notifications, refresh, markRead, markAllRead } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Automatically mark notifications as read on screen open (TikTok / Facebook style)
  useEffect(() => {
    refresh()
      .then(() => {
        // Silently mark all as read in background so red badges clear naturally
        markAllRead().catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [refresh, markAllRead]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      await markAllRead();
    } finally {
      setRefreshing(false);
    }
  };

  // Group notifications chronologically: New (Today), This Week, Earlier
  const sections = useMemo<NotificationSection[]>(() => {
    if (!notifications || notifications.length === 0) return [];

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    const todayItems: AppNotification[] = [];
    const thisWeekItems: AppNotification[] = [];
    const earlierItems: AppNotification[] = [];

    notifications.forEach((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      const diff = now - itemTime;

      if (diff < oneDayMs) {
        todayItems.push(item);
      } else if (diff < sevenDaysMs) {
        thisWeekItems.push(item);
      } else {
        earlierItems.push(item);
      }
    });

    const result: NotificationSection[] = [];
    if (todayItems.length > 0) result.push({ title: t("notificationsScreen.newSection", "NEW"), data: todayItems });
    if (thisWeekItems.length > 0) result.push({ title: t("notificationsScreen.thisWeekSection", "THIS WEEK"), data: thisWeekItems });
    if (earlierItems.length > 0) result.push({ title: t("notificationsScreen.earlierSection", "EARLIER"), data: earlierItems });

    return result;
  }, [notifications, t]);

  const handleAction = async (item: AppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.read) {
      markRead(item._id).catch(() => {});
    }

    if (item.type === "match" || item.type === "missed_call") {
      if (item.fromUser?._id) {
        try {
          const chat = await createOrGetChat(item.fromUser._id);
          router.push({
            pathname: "/screen/ChatDetail/[chatId]",
            params: {
              chatId: chat._id,
              name: item.fromUser.username,
              avatar: item.fromUser.profileImage || "",
              otherUserId: item.fromUser._id,
            },
          });
          return;
        } catch (err) {
          console.error("Failed to open chat from notification:", err);
        }
      }
    }

    // Default for likes or favorites: take them to discovery / likes feed
    router.push("/(tabs)/likes");
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const details = getNotificationDetails(item);

    return (
      <Pressable
        onPress={() => handleAction(item)}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: !item.read
              ? isDark
                ? "rgba(230, 57, 70, 0.08)"
                : "rgba(230, 57, 70, 0.04)"
              : colors.background,
            borderBottomColor: colors.border,
          },
          pressed && {
            backgroundColor: isDark ? colors.surfaceAlt : "#f1f2f4",
          },
        ]}
      >
        {/* Avatar with status badge overlay */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.fromUser?.profileImage ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
            }}
            style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}
          />
          <View
            style={[
              styles.badgeOverlay,
              {
                backgroundColor: details.badgeBg,
                borderColor: colors.surface,
              },
            ]}
          >
            <Ionicons name={details.icon} size={11} color="#ffffff" />
          </View>
        </View>

        {/* Narrative text description */}
        <View style={styles.textContainer}>
          <Text style={[styles.narrativeText, { color: colors.textSecondary }]}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {details.user}{" "}
            </Text>
            {details.actionText}
          </Text>

          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              {formatRelativeTime(item.createdAt)}
            </Text>
            {!item.read && (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: colors.accent },
                ]}
              />
            )}
          </View>
        </View>

        {/* Right contextual action pill (like TikTok / Facebook) */}
        <Pressable
          onPress={() => handleAction(item)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.actionButton,
            details.actionButtonType === "primary" && {
              backgroundColor: colors.accent,
            },
            details.actionButtonType === "secondary" && {
              backgroundColor: isDark ? colors.surfaceAlt : colors.accentSoft,
              borderWidth: 1,
              borderColor: isDark ? colors.border : "transparent",
            },
            details.actionButtonType === "outline" && {
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
          ]}
        >
          <Text
            style={[
              styles.actionButtonText,
              details.actionButtonType === "primary" && { color: "#ffffff" },
              details.actionButtonType === "secondary" && {
                color: isDark ? colors.text : colors.accent,
              },
              details.actionButtonType === "outline" && {
                color: colors.text,
              },
            ]}
          >
            {details.actionButtonLabel}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: NotificationSection;
  }) => (
    <View
      style={[
        styles.sectionHeaderContainer,
        { backgroundColor: colors.background },
      ]}
    >
      <Text style={[styles.sectionHeaderText, { color: colors.textTertiary }]}>
        {title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.background}
      />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("notificationsScreen.title", "Notifications")}
        </Text>

        <View style={styles.headerRightSpace} />
      </View>

      {/* Feed Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            sections.length === 0 ? styles.emptyContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateWrapper}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isDark ? colors.surfaceAlt : colors.accentSoft },
                ]}
              >
                <Ionicons
                  name="notifications-off-outline"
                  size={36}
                  color={colors.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("notificationsScreen.noNotifications", "No Notifications Yet")}
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                When you get matches, likes, or calls, they will appear here in
                real-time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerRightSpace: {
    width: 34,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 32,
  },
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  badgeOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
    justifyContent: "center",
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 19,
  },
  userName: {
    fontWeight: "700",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
