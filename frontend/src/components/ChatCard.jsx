import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

function formatChatTime(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatCard({ chat, onPress }) {
  const { colors } = useTheme();
  const hasUnread = chat.unread > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.surfaceAlt },
      ]}
      onPress={onPress}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: chat.avatar }} style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]} />
        {chat.isOnline && (
          <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {chat.userName}
        </Text>
        <Text
          style={[
            styles.message,
            { color: colors.textSecondary },
            hasUnread && { color: colors.text, fontWeight: "600" },
          ]}
          numberOfLines={1}
        >
          {chat.lastMessage || "Say hi 👋"}
        </Text>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.time,
            { color: colors.textTertiary },
            hasUnread && { color: colors.accent, fontWeight: "700" },
          ]}
        >
          {formatChatTime(chat.time)}
        </Text>
        {hasUnread ? (
          <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.unreadText}>
              {chat.unread > 9 ? "9+" : chat.unread}
            </Text>
          </View>
        ) : (
          <View style={styles.badgeSpacer} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  message: {
    fontSize: 14,
    marginTop: 3,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 40,
  },
  time: {
    fontSize: 12,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  badgeSpacer: {
    height: 20,
    marginTop: 6,
  },
});
