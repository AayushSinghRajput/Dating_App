import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ChatCard({ chat, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: chat.avatar }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{chat.userName}</Text>
        <Text style={styles.message} numberOfLines={1}>
          {chat.lastMessage}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>{chat.time}</Text>
        {chat.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{chat.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#e63946",
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  unreadBadge: {
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
