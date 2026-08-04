import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAllChats } from "@/utils/api";
import ChatCard from "../../src/components/ChatCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

interface Chat {
  id: string;
  otherUserId: string;
  userName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline?: boolean;
}

interface OnlineUserProps {
  item: Chat;
}

interface ChatsHeaderProps {
  chatsCount: number;
}

export default function Chats() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await getAllChats();
        console.log("Fetched chats from API:", data);

        if (Array.isArray(data) && data.length > 0) {
          // Map backend _id to id if necessary
          const mappedChats = data.map((chat) => ({
            ...chat,
            id: chat.id || chat._id, // fallback if API returns _id
          }));
          setChats(mappedChats);
        } else {
          console.log("No chats found for this user");
          setChats([]);
        }
      } catch (error: any) {
        console.error("Error fetching chats:", error.message);
        Toast.show({
          type:'error',
          text1:error.message,
          text2:'Failed to fetch chats',
        })
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const unreadCount = chats.filter((chat: Chat) => chat.unread > 0).length;

  const OnlineUser = ({ item }: OnlineUserProps) => (
    <Pressable style={styles.onlineUser}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.onlineAvatar} />
        <View style={styles.onlineIndicator} />
      </View>
      <Text style={styles.onlineName} numberOfLines={1}>
        {item.userName.split(" ")[0]}
      </Text>
    </Pressable>
  );

  const ChatsHeader = ({ chatsCount }: ChatsHeaderProps) => (
    <View style={styles.chatsHeader}>
      <Text style={styles.chatsTitle}>Recent Conversations</Text>
      <Text style={styles.chatsCount}>
        {chatsCount} {chatsCount === 1 ? "chat" : "chats"}
      </Text>
    </View>
  );

  const onlineUsers = chats.filter((chat) => chat.isOnline);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={{ color: "#555", marginTop: 8 }}>Loading Chats...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      {/* Online Users Strip */}
      {onlineUsers.length > 0 && (
        <View style={styles.onlineSection}>
          <Text style={styles.onlineTitle}>Online Now</Text>
          <FlatList
            horizontal
            data={onlineUsers}
            keyExtractor={(item: Chat) => `online-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.onlineList}
            renderItem={({ item }: { item: Chat }) => (
              <OnlineUser item={item} />
            )}
          />
        </View>
      )}

      {/* Chats List */}
      <View style={styles.chatsContainer}>
        <ChatsHeader chatsCount={chats.length} />

        <FlatList
          data={chats}
          keyExtractor={(item: Chat) => item.id}
          renderItem={({ item }: { item: Chat }) => (
            <ChatCard
              chat={item}
              onPress={() =>
                router.push({
                  pathname: "/screen/ChatDetail/[chatId]",
                  params: {
                    chatId: item.id,
                    name: item.userName,
                    avatar: item.avatar,
                    otherUserId: item.otherUserId,
                  },
                })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatsList}
        />
      </View>

      {/* New Message Floating Button */}
      <Pressable
        style={styles.newMessageButton}
        onPress={() => console.log("New message")}
      >
        <Ionicons name="create" size={24} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: "#e63946",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  onlineSection: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    marginLeft: 20,
  },
  onlineList: { paddingHorizontal: 16, gap: 16 },
  onlineUser: { alignItems: "center", width: 60 },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
    position: "relative",
  },
  onlineAvatar: { width: "100%", height: "100%", borderRadius: 28 },
  onlineIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
    position: "absolute",
    bottom: -2,
    right: -2,
    zIndex: 10,
  },
  onlineName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  chatsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 8,
    overflow: "hidden",
  },
  chatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  chatsTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  chatsCount: { fontSize: 14, fontWeight: "600", color: "#666" },
  chatsList: { paddingBottom: 8 },
  newMessageButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e63946",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
});
