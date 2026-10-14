import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useChatNotifications } from "@/contexts/ChatNotificationContext";
import { getAllChats, createOrGetChat } from "@/services/chatService";
import { getMatches, MatchProfile } from "@/services/matchService";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import TabSwipeWrapper from "@/src/components/TabSwipeWrapper";
import { socket, connectSocket } from "../../utils/socket";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as any).nativeFabricUIManager
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

type FilterTab = "all" | "unread" | "online";

function formatChatTime(dateInput?: string): string {
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

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Chats() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { unreadChatsCount } = useChatNotifications();

  const [chats, setChats] = useState<Chat[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openingMatchId, setOpeningMatchId] = useState<string | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const onlineUserIdsRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [chatsData, matchesData] = await Promise.all([
        getAllChats().catch((err) => {
          if (err.message !== "User not authenticated") {
            console.warn("Failed to fetch chats:", err?.message);
          }
          return [] as any[];
        }),
        getMatches().catch((err) => {
          console.warn("Failed to fetch matches:", err?.message);
          return [] as MatchProfile[];
        }),
      ]);

      if (Array.isArray(chatsData)) {
        const mappedChats: Chat[] = chatsData.map((c) => {
          const otherId = String(c.otherUserId || "");
          const isOnline = Boolean(
            c.isOnline || (otherId && onlineUserIdsRef.current.has(otherId))
          );
          return {
            ...c,
            id: c.id || c._id,
            isOnline,
          };
        });
        setChats(mappedChats);
      } else {
        setChats([]);
      }

      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (error: any) {
      if (error?.message !== "User not authenticated") {
        Toast.show({
          type: "error",
          text1: "Error loading chats",
          text2: error?.message || "Please check your network connection.",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, unreadChatsCount]);

  // Real-time online presence and unmatch handling
  useEffect(() => {
    connectSocket();

    const handleOnlineUsers = (ids: string[]) => {
      const set = new Set((ids || []).map((id) => String(id)));
      onlineUserIdsRef.current = set;
      setChats((prev) =>
        prev.map((c) => {
          const isOnline = set.has(String(c.otherUserId));
          return c.isOnline === isOnline ? c : { ...c, isOnline };
        })
      );
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      if (!userId) return;
      const idStr = String(userId);
      onlineUserIdsRef.current.add(idStr);
      setChats((prev) =>
        prev.map((c) =>
          String(c.otherUserId) === idStr && !c.isOnline
            ? { ...c, isOnline: true }
            : c
        )
      );
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      if (!userId) return;
      const idStr = String(userId);
      onlineUserIdsRef.current.delete(idStr);
      setChats((prev) =>
        prev.map((c) =>
          String(c.otherUserId) === idStr && c.isOnline
            ? { ...c, isOnline: false }
            : c
        )
      );
    };

    const handleConnect = () => {
      socket.emit("getOnlineUsers");
    };

    const handleUnmatched = ({ byUserId }: { byUserId: string }) => {
      setChats((prev) => prev.filter((chat) => chat.otherUserId !== byUserId));
      setMatches((prev) => prev.filter((m) => m.userId !== byUserId));
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("connect", handleConnect);
    socket.on("unmatched", handleUnmatched);

    if (socket.connected) {
      socket.emit("getOnlineUsers");
    }

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("connect", handleConnect);
      socket.off("unmatched", handleUnmatched);
    };
  }, []);

  const totalUnread = useMemo(
    () => chats.reduce((acc, c) => acc + (c.unread > 0 ? c.unread : 0), 0),
    [chats]
  );

  const onlineCount = useMemo(
    () => chats.filter((c) => c.isOnline).length,
    [chats]
  );

  const filteredChats = useMemo(() => {
    let list = chats;

    // Apply Filter Tab
    if (activeFilter === "unread") {
      list = list.filter((c) => c.unread > 0);
    } else if (activeFilter === "online") {
      list = list.filter((c) => c.isOnline);
    }

    // Apply Search Query
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter(
      (c) =>
        c.userName?.toLowerCase().includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
    );
  }, [chats, activeFilter, searchQuery]);

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery("");
    } else {
      setIsSearching(true);
      setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  };

  const handleOpenChat = (chat: Chat) => {
    Haptics.selectionAsync();
    router.push({
      pathname: "/screen/ChatDetail/[chatId]",
      params: {
        chatId: chat.id,
        name: chat.userName,
        avatar: chat.avatar || "",
        otherUserId: chat.otherUserId,
      },
    });
  };

  const handleOpenMatch = async (match: MatchProfile) => {
    Haptics.selectionAsync();
    setOpeningMatchId(match.userId);
    try {
      const chat = await createOrGetChat(match.userId);
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: match.name,
          avatar: match.profileImage || "",
          otherUserId: match.userId,
        },
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to open chat",
        text2: err?.message || "Please try again.",
      });
    } finally {
      setOpeningMatchId(null);
    }
  };

  const subtitleText = totalUnread > 0
    ? `${totalUnread} ${totalUnread === 1 ? "unread message" : "unread messages"}`
    : "Connect with your sparks";

  return (
    <TabSwipeWrapper leftTab="/(tabs)/settings" rightTab="/(tabs)/likes" disabled={isSearching}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader
        title={t("chatScreen.title", "Messages")}
        subtitle={subtitleText}
        actions={[
          {
            icon: isSearching ? "close" : "search",
            accessibilityLabel: isSearching ? "Close search" : "Search messages",
            onPress: toggleSearch,
          },
        ]}
      />

      {/* Search Input Bar (when toggled) */}
      {isSearching && (
        <View style={[styles.searchBarWrapper, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.accent} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t("chatScreen.searchPlaceholder", "Search conversations by name...")}
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable hitSlop={8} onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t("chatScreen.loadingChats", "Loading your conversations...")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListHeaderComponent={
            <>
              {/* 1. New Matches Horizontal Story Strip */}
              {!isSearching && (
                <View style={styles.matchesSection}>
                  <View style={styles.matchesSectionHeader}>
                    <View style={styles.matchesHeadingRow}>
                      <Ionicons name="sparkles" size={15} color="#e63946" />
                      <Text style={[styles.matchesHeading, { color: colors.text }]}>
                        New Matches
                      </Text>
                      {matches.length > 0 && (
                        <View style={styles.matchesCountBadge}>
                          <Text style={styles.matchesCountText}>{matches.length}</Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => router.push("/(tabs)/likes")}
                    >
                      <Text style={[styles.seeAllText, { color: colors.accent }]}>
                        See all
                      </Text>
                    </Pressable>
                  </View>

                  {matches.length > 0 ? (
                    <FlatList
                      horizontal
                      data={matches}
                      keyExtractor={(item) => `match-${item.id}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.matchesHorizontalList}
                      renderItem={({ item }) => {
                        const isOpening = openingMatchId === item.userId;
                        return (
                          <Pressable
                            style={styles.matchItem}
                            onPress={() => handleOpenMatch(item)}
                            disabled={isOpening}
                          >
                            <View style={styles.matchAvatarRingWrapper}>
                              <LinearGradient
                                colors={["#e63946", "#f59e0b", "#ec4899"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.matchGradientRing}
                              >
                                <View style={[styles.matchAvatarInner, { backgroundColor: colors.surface }]}>
                                  <Image
                                    source={{
                                      uri: item.profileImage || "https://placehold.co/150x150",
                                    }}
                                    style={styles.matchAvatarImage}
                                    contentFit="cover"
                                    transition={200}
                                  />
                                </View>
                              </LinearGradient>

                              {isOpening ? (
                                <View style={styles.matchOpeningBadge}>
                                  <ActivityIndicator size="small" color="#ffffff" />
                                </View>
                              ) : (
                                <View style={styles.matchHeartBadge}>
                                  <Ionicons name="heart" size={10} color="#ffffff" />
                                </View>
                              )}
                            </View>

                            <Text
                              style={[styles.matchName, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {item.name ? item.name.split(" ")[0] : "Match"}
                            </Text>
                          </Pressable>
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.noMatchesPrompt}>
                      <Pressable
                        style={[styles.findMatchesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => router.push("/(tabs)")}
                      >
                        <LinearGradient
                          colors={["#e63946", "#f59e0b"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.findMatchesIconWrap}
                        >
                          <Ionicons name="flame" size={20} color="#ffffff" />
                        </LinearGradient>
                        <View style={styles.findMatchesTextWrap}>
                          <Text style={[styles.findMatchesTitle, { color: colors.text }]}>
                            Swipe to meet new people
                          </Text>
                          <Text style={[styles.findMatchesDesc, { color: colors.textSecondary }]}>
                            When you both like each other, your sparks show up here!
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* 2. Messages List Section Header & Filter Pills */}
              <View style={styles.conversationsHeader}>
                <View style={styles.conversationsHeadingRow}>
                  <Text style={[styles.conversationsHeading, { color: colors.text }]}>
                    Conversations
                  </Text>
                  {chats.length > 0 && (
                    <Text style={[styles.conversationsCount, { color: colors.textSecondary }]}>
                      ({chats.length})
                    </Text>
                  )}
                </View>

                {/* Filter Pills */}
                {!isSearching && chats.length > 0 && (
                  <View style={styles.filterPillsRow}>
                    <Pressable
                      style={[
                        styles.filterPill,
                        activeFilter === "all"
                          ? [styles.filterPillActive, { backgroundColor: colors.accent }]
                          : { backgroundColor: colors.surfaceAlt },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveFilter("all");
                      }}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          { color: activeFilter === "all" ? "#ffffff" : colors.textSecondary },
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterPill,
                        activeFilter === "unread"
                          ? [styles.filterPillActive, { backgroundColor: colors.accent }]
                          : { backgroundColor: colors.surfaceAlt },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveFilter("unread");
                      }}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          { color: activeFilter === "unread" ? "#ffffff" : colors.textSecondary },
                        ]}
                      >
                        Unread {totalUnread > 0 ? `(${totalUnread})` : ""}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.filterPill,
                        activeFilter === "online"
                          ? [styles.filterPillActive, { backgroundColor: colors.accent }]
                          : { backgroundColor: colors.surfaceAlt },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveFilter("online");
                      }}
                    >
                      <View style={styles.onlineDotIndicator} />
                      <Text
                        style={[
                          styles.filterPillText,
                          { color: activeFilter === "online" ? "#ffffff" : colors.textSecondary },
                        ]}
                      >
                        Online {onlineCount > 0 ? `(${onlineCount})` : ""}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </>
          }
          renderItem={({ item }) => {
            const hasUnread = item.unread > 0;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.chatRow,
                  { backgroundColor: colors.surface },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() => handleOpenChat(item)}
              >
                {/* Avatar with Online Badge */}
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: item.avatar || "https://placehold.co/150x150" }}
                    style={styles.chatAvatar}
                    contentFit="cover"
                    transition={200}
                  />
                  {item.isOnline && (
                    <View style={[styles.avatarOnlineDot, { borderColor: colors.surface }]} />
                  )}
                </View>

                {/* Name & Last Message Info */}
                <View style={styles.chatInfo}>
                  <View style={styles.chatNameRow}>
                    <Text
                      style={[
                        styles.chatName,
                        { color: colors.text },
                        hasUnread && styles.chatNameUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.userName}
                    </Text>
                    <Text
                      style={[
                        styles.chatTime,
                        { color: hasUnread ? colors.accent : colors.textTertiary },
                        hasUnread && styles.chatTimeUnread,
                      ]}
                    >
                      {formatChatTime(item.time)}
                    </Text>
                  </View>

                  <View style={styles.chatMessageRow}>
                    <Text
                      style={[
                        styles.lastMessageText,
                        { color: hasUnread ? colors.text : colors.textSecondary },
                        hasUnread && styles.lastMessageUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage || "Say hi 👋"}
                    </Text>

                    {hasUnread && (
                      <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unread > 9 ? "9+" : item.unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchQuery.trim().length > 0 ? (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="search-outline" size={36} color={colors.textTertiary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No conversations found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    No matches found for &ldquo;{searchQuery}&rdquo;. Try another name.
                  </Text>
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => setSearchQuery("")}
                  >
                    <Text style={[styles.emptyActionBtnText, { color: colors.text }]}>
                      Clear Search
                    </Text>
                  </Pressable>
                </>
              ) : activeFilter === "unread" ? (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
                    <Ionicons name="checkmark-done" size={36} color="#10b981" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    You&apos;re All Caught Up!
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    You have no unread messages right now.
                  </Text>
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => setActiveFilter("all")}
                  >
                    <Text style={[styles.emptyActionBtnText, { color: "#ffffff" }]}>
                      Show All Messages
                    </Text>
                  </Pressable>
                </>
              ) : activeFilter === "online" ? (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="moon-outline" size={36} color={colors.textTertiary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No One Online Right Now
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    Your matches will show up here when they are active.
                  </Text>
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => setActiveFilter("all")}
                  >
                    <Text style={[styles.emptyActionBtnText, { color: "#ffffff" }]}>
                      View All Messages
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(230, 57, 70, 0.12)" }]}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#e63946" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Messages Yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    When you both like each other, you form a match and can start conversations here!
                  </Text>
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => router.push("/(tabs)")}
                  >
                    <Ionicons name="flame" size={18} color="#ffffff" />
                    <Text style={[styles.emptyActionBtnText, { color: "#ffffff" }]}>
                      Discover People
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          }
        />
      )}
      </View>
    </TabSwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 40,
  },

  /* Search Bar */
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },

  /* New Matches Horizontal Section */
  matchesSection: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  matchesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  matchesHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  matchesHeading: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  matchesCountBadge: {
    backgroundColor: "#e63946",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  matchesCountText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "800",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  matchesHorizontalList: {
    paddingHorizontal: 14,
    gap: 14,
  },
  matchItem: {
    alignItems: "center",
    width: 68,
  },
  matchAvatarRingWrapper: {
    position: "relative",
    marginBottom: 6,
  },
  matchGradientRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  matchAvatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
    overflow: "hidden",
  },
  matchAvatarImage: {
    width: "100%",
    height: "100%",
  },
  matchHeartBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: "#e63946",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  matchOpeningBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: "#e63946",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  matchName: {
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },

  /* Empty Matches Prompt */
  noMatchesPrompt: {
    paddingHorizontal: 16,
  },
  findMatchesCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  findMatchesIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  findMatchesTextWrap: {
    flex: 1,
  },
  findMatchesTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  findMatchesDesc: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 15,
  },

  /* Conversations Section Header & Filter Pills */
  conversationsHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  conversationsHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  conversationsHeading: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  conversationsCount: {
    fontSize: 15,
    fontWeight: "600",
  },
  filterPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  filterPillActive: {
    shadowColor: "#e63946",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  onlineDotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10b981",
  },

  /* Chat Rows */
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  avatarWrapper: {
    position: "relative",
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarOnlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#22c55e",
    borderWidth: 2.5,
    zIndex: 2,
    elevation: 3,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    flex: 1,
  },
  chatNameUnread: {
    fontWeight: "800",
  },
  chatTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  chatTimeUnread: {
    fontWeight: "700",
  },
  chatMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  lastMessageText: {
    fontSize: 13.5,
    lineHeight: 18,
    flex: 1,
  },
  lastMessageUnread: {
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 86,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 36,
    gap: 8,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    marginTop: 4,
  },
  emptyActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
