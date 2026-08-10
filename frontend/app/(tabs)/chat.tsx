import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getAllChats } from "@/services/chatService";
import ChatCard from "../../src/components/ChatCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { socket, connectSocket } from "@/utils/socket";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  isSearching: boolean;
}

export default function Chats() {
  const router = useRouter();
  const { colors } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

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
          type: 'error',
          text1: error.message,
          text2: 'Failed to fetch chats',
        })
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Live-remove a chat if the other person unmatches while we're not in that screen
  useEffect(() => {
    connectSocket();
    const handleUnmatched = ({ byUserId }: { byUserId: string }) => {
      setChats((prev) => prev.filter((chat) => chat.otherUserId !== byUserId));
    };
    socket.on("unmatched", handleUnmatched);
    return () => {
      socket.off("unmatched", handleUnmatched);
    };
  }, []);

  const unreadCount = chats.filter((chat: Chat) => chat.unread > 0).length;

  const filteredChats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chats;
    return chats.filter((chat: Chat) =>
      chat.userName?.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const openSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearching(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearching(false);
    setSearchQuery("");
  };

  const OnlineUser = ({ item }: OnlineUserProps) => (
    <Pressable style={styles.onlineUser}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={[styles.onlineAvatar, { backgroundColor: colors.surfaceAlt }]} />
        <View style={[styles.onlineIndicator, { borderColor: colors.surface }]} />
      </View>
      <Text style={[styles.onlineName, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.userName.split(" ")[0]}
      </Text>
    </Pressable>
  );

  const ChatsHeader = ({ chatsCount, isSearching }: ChatsHeaderProps) => (
    <View style={[styles.chatsHeader, { borderBottomColor: colors.surfaceAlt }]}>
      <Text style={[styles.chatsTitle, { color: colors.text }]}>
        {isSearching ? "Search Results" : "Recent Conversations"}
      </Text>
      <Text style={[styles.chatsCount, { color: colors.textSecondary }]}>
        {chatsCount} {chatsCount === 1 ? "chat" : "chats"}
      </Text>
    </View>
  );

  const onlineUsers = chats.filter((chat) => chat.isOnline);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading Chats...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {isSearching ? (
          <View style={styles.searchRow}>
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="search" size={19} color={colors.accent} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by name..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  hitSlop={8}
                  onPress={() => setSearchQuery("")}
                >
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
            <Pressable onPress={closeSearch} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
                {unreadCount > 0
                  ? `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"
                  }`
                  : "You're all caught up"}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.searchButton,
                { backgroundColor: colors.accentSoft },
                pressed && { backgroundColor: colors.accentSoftPressed, transform: [{ scale: 0.96 }] },
              ]}
              onPress={openSearch}
            >
              <Ionicons name="search" size={22} color={colors.accent} />
            </Pressable>
          </>
        )}
      </View>

      {/* Online Users Strip */}
      {!isSearching && onlineUsers.length > 0 && (
        <View style={[styles.onlineSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.onlineTitle, { color: colors.text }]}>Online Now</Text>
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
      <View style={[styles.chatsContainer, { backgroundColor: colors.surface }]}>
        <ChatsHeader chatsCount={filteredChats.length} isSearching={isSearching} />

        <FlatList
          data={filteredChats}
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
          ListEmptyComponent={
            isSearching && searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.border} />
                <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
                  No conversations found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.textTertiary }]}>
                  Try searching a different name
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 68,
  },
  headerContent: { gap: 2 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  searchRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 64,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 4,
  },
  onlineSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    position: "absolute",
    bottom: -2,
    right: -2,
    zIndex: 10,
  },
  onlineName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  chatsContainer: {
    flex: 1,
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
  },
  chatsTitle: { fontSize: 18, fontWeight: "700" },
  chatsCount: { fontSize: 14, fontWeight: "600" },
  chatsList: { paddingBottom: 8 },
});
