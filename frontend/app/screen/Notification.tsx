import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { AppNotification } from "@/services/notificationService";
import { createOrGetChat } from "@/services/chatService";

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function describeNotification(item: AppNotification) {
  const name = item.fromUser?.username || "Someone";
  switch (item.type) {
    case "like":
      return { user: name, text: "liked your profile", icon: "heart" as const, color: "#e63946" };
    case "match":
      return { user: name, text: "It's a match! 🎉", icon: "sparkles" as const, color: "#4CAF50" };
    case "favorite":
      return { user: name, text: "added you to favorites", icon: "star" as const, color: "#FFB800" };
    case "missed_call":
      return {
        user: name,
        text: `Missed ${item.callType === "video" ? "video" : "voice"} call`,
        icon: item.callType === "video" ? ("videocam" as const) : ("call" as const),
        color: "#FF6B6B",
      };
    default:
      return { user: name, text: "sent a notification", icon: "notifications" as const, color: "#888" };
  }
}

export default function Notification() {
  const { colors } = useTheme();
  const router = useRouter();
  const { notifications, unreadCount, refresh, markRead, markAllRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredNotifications =
    activeFilter === "unread" ? notifications.filter((item) => !item.read) : notifications;

  const NotificationCard = ({ item }: { item: AppNotification }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const { user, text, icon, color } = describeNotification(item);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    const handlePress = async () => {
      if (!item.read) markRead(item._id);

      // Matches and missed calls naturally lead into a conversation; likes don't
      // carry enough profile data here to open a profile screen, so just mark read.
      if ((item.type === "match" || item.type === "missed_call") && item.fromUser) {
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
        } catch (err) {
          console.error("Failed to open chat from notification:", err);
        }
      }
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.surface, shadowColor: colors.shadow, borderColor: "transparent" },
            !item.read && { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed },
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: item.fromUser?.profileImage || "https://placehold.co/100x100",
              }}
              style={[styles.avatar, { borderColor: colors.surface }]}
            />
            <View style={[styles.iconBadge, { backgroundColor: color, borderColor: colors.surface }]}>
              <Ionicons name={icon} size={12} color="#fff" />
            </View>
          </View>

          <View style={styles.textWrapper}>
            <Text style={[styles.notificationText, { color: colors.text }]}>
              <Text style={[styles.user, { color: colors.text }]}>{user}</Text> {text}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
          </View>

          {!item.read && <View style={[styles.unreadIndicator, { backgroundColor: colors.accent }]} />}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.header,
          { backgroundColor: colors.surface, shadowColor: colors.shadow, opacity: fadeAnim },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.headerIcons}>
            {unreadCount > 0 && (
              <Pressable style={styles.markAllButton} onPress={markAllRead}>
                <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
                <Text style={[styles.markAllText, { color: colors.textSecondary }]}>Mark all read</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.filterContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            style={[
              styles.filterButton,
              activeFilter === "all" && [
                styles.filterButtonActive,
                { backgroundColor: colors.surface, shadowColor: colors.shadow },
              ],
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                activeFilter === "all" && { color: colors.accent },
              ]}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterButton,
              activeFilter === "unread" && [
                styles.filterButtonActive,
                { backgroundColor: colors.surface, shadowColor: colors.shadow },
              ],
            ]}
            onPress={() => setActiveFilter("unread")}
          >
            <View style={styles.unreadFilter}>
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  activeFilter === "unread" && { color: colors.accent },
                ]}
              >
                Unread
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>No notifications</Text>
          <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
            {activeFilter === "unread"
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  filterButtonActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  unreadFilter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  textWrapper: {
    flex: 1,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  user: {
    fontWeight: "700",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
