import { View, Text, StyleSheet, FlatList, Image, Pressable, Animated } from "react-native";
import { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

// Mock data structure - replace with your actual data
const notifications = [
  {
    id: "1",
    user: "Sarah Johnson",
    type: "liked your profile",
    time: "5 min ago",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    read: false,
    typeIcon: "heart",
    typeColor: "#e63946"
  },
  {
    id: "2",
    user: "Mike Chen",
    type: "sent you a message",
    time: "1 hour ago",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    read: false,
    typeIcon: "chatbubble",
    typeColor: "#007AFF"
  },
  {
    id: "3",
    user: "Dating App",
    type: "New matches available in your area",
    time: "2 hours ago",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face",
    read: true,
    typeIcon: "people",
    typeColor: "#4CAF50"
  },
  {
    id: "4",
    user: "Emma Wilson",
    type: "liked your photo",
    time: "3 hours ago",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    read: true,
    typeIcon: "heart",
    typeColor: "#e63946"
  },
  {
    id: "5",
    user: "Alex Rodriguez",
    type: "viewed your profile",
    time: "5 hours ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    read: true,
    typeIcon: "eye",
    typeColor: "#FF6B6B"
  },
  {
    id: "6",
    user: "Dating App",
    type: "Profile boost activated! You'll get 5x more views",
    time: "1 day ago",
    avatar: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face",
    read: true,
    typeIcon: "rocket",
    typeColor: "#9C27B0"
  }
];

type NotificationItem = {
  id: string;
  user: string;
  type: string;
  time: string;
  avatar: string;
  read: boolean;
  typeIcon: string;
  typeColor: string;
};

export default function Notification() {
  const { colors } = useTheme();
  const [notificationData, setNotificationData] = useState<NotificationItem[]>(notifications);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const filteredNotifications = activeFilter === "unread"
    ? notificationData.filter(item => !item.read)
    : notificationData;

  const markAsRead = (id: string) => {
    setNotificationData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationData(prev =>
      prev.map(item => ({ ...item, read: true }))
    );
  };

  const unreadCount = notificationData.filter(item => !item.read).length;

  const NotificationCard = ({ item }: { item: NotificationItem }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      if (!item.read) {
        markAsRead(item.id);
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
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.avatar }} style={[styles.avatar, { borderColor: colors.surface }]} />
            <View style={[styles.iconBadge, { backgroundColor: item.typeColor, borderColor: colors.surface }]}>
              <Ionicons name={item.typeIcon as any} size={12} color="#fff" />
            </View>
          </View>

          <View style={styles.textWrapper}>
            <Text style={[styles.notificationText, { color: colors.text }]}>
              <Text style={[styles.user, { color: colors.text }]}>{item.user}</Text> {item.type}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.time, { color: colors.textSecondary }]}>{item.time}</Text>
            </View>
          </View>

          {!item.read && (
            <View style={[styles.unreadIndicator, { backgroundColor: colors.accent }]} />
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, { backgroundColor: colors.surface, shadowColor: colors.shadow, opacity: fadeAnim }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          <View style={styles.headerIcons}>
            {unreadCount > 0 && (
              <Pressable style={styles.markAllButton} onPress={markAllAsRead}>
                <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
                <Text style={[styles.markAllText, { color: colors.textSecondary }]}>Mark all read</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.filterContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            style={[styles.filterButton, activeFilter === "all" && [styles.filterButtonActive, { backgroundColor: colors.surface, shadowColor: colors.shadow }]]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, activeFilter === "all" && { color: colors.accent }]}>
              All
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterButton, activeFilter === "unread" && [styles.filterButtonActive, { backgroundColor: colors.surface, shadowColor: colors.shadow }]]}
            onPress={() => setActiveFilter("unread")}
          >
            <View style={styles.unreadFilter}>
              <Text style={[styles.filterText, { color: colors.textSecondary }, activeFilter === "unread" && { color: colors.accent }]}>
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

      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>No notifications</Text>
          <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
            {activeFilter === "unread"
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationCard item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    letterSpacing: -0.5,
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
