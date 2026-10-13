import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getLikedByMe,
  getMatches,
  likeProfile,
  passProfile,
  LikedByProfile,
  MatchProfile,
} from "@/services/matchService";
import { createOrGetChat } from "@/services/chatService";
import { showMatchCelebration } from "@/src/components/GlobalMatchCelebration";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { radius } from "@/src/theme/radius";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

type ActiveTab = "likes" | "matches";

export default function LikesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("likes");
  const [likes, setLikes] = useState<LikedByProfile[]>([]);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [likesData, matchesData] = await Promise.all([
        getLikedByMe().catch((err) => {
          console.warn("Failed to fetch likes:", err?.message);
          return [] as LikedByProfile[];
        }),
        getMatches().catch((err) => {
          console.warn("Failed to fetch matches:", err?.message);
          return [] as MatchProfile[];
        }),
      ]);
      setLikes(likesData);
      setMatches(matchesData);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error loading data",
        text2: error?.message || "Please check your network connection.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLikeBack = async (profile: LikedByProfile) => {
    setBusyId(profile.id);
    try {
      const response = await likeProfile(profile.id);
      setLikes((prev) => prev.filter((p) => p.id !== profile.id));

      if (response?.match) {
        showMatchCelebration({
          userName: profile.name,
          userAvatar: profile.profileImage,
          otherUserId: profile.userId,
        });
        // Refresh matches since a new match was formed
        const updatedMatches = await getMatches().catch(() => matches);
        setMatches(updatedMatches);
      } else {
        Toast.show({
          type: "success",
          text1: `Liked ${profile.name}`,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to like back",
        text2: error?.message || "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handlePass = async (profile: LikedByProfile) => {
    setBusyId(profile.id);
    try {
      await passProfile(profile.id);
      setLikes((prev) => prev.filter((p) => p.id !== profile.id));
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to pass",
        text2: error?.message || "Something went wrong.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleOpenChat = async (match: MatchProfile) => {
    setMessagingUserId(match.userId);
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
      setMessagingUserId(null);
    }
  };

  const handleOpenProfile = (profile: LikedByProfile | MatchProfile) => {
    router.push({
      pathname: "/screen/UserDetail/[userId]",
      params: {
        user: JSON.stringify(profile),
        userId: profile.id,
      },
    });
  };

  const subtitle =
    activeTab === "likes"
      ? likes.length > 0
        ? `${likes.length} ${likes.length === 1 ? "person" : "people"} liked you`
        : undefined
      : matches.length > 0
      ? `${matches.length} mutual ${matches.length === 1 ? "match" : "matches"}`
      : undefined;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Likes & Matches" subtitle={subtitle} />

      {/* Segmented Sub-tab Control */}
      <View style={[styles.tabBarContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.tabBarTrack, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            style={[
              styles.tabButton,
              activeTab === "likes" && [
                styles.tabButtonActive,
                { backgroundColor: colors.surface, shadowColor: colors.shadow },
              ],
            ]}
            onPress={() => setActiveTab("likes")}
          >
            <Ionicons
              name={activeTab === "likes" ? "heart" : "heart-outline"}
              size={18}
              color={activeTab === "likes" ? colors.accent : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "likes" ? colors.text : colors.textSecondary },
                activeTab === "likes" && styles.tabButtonTextActive,
              ]}
            >
              Likes You
            </Text>
            {likes.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: activeTab === "likes" ? colors.accent : colors.border },
                ]}
              >
                <Text style={styles.tabBadgeText}>{likes.length}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.tabButton,
              activeTab === "matches" && [
                styles.tabButtonActive,
                { backgroundColor: colors.surface, shadowColor: colors.shadow },
              ],
            ]}
            onPress={() => setActiveTab("matches")}
          >
            <Ionicons
              name={activeTab === "matches" ? "sparkles" : "sparkles-outline"}
              size={18}
              color={activeTab === "matches" ? "#ff7b00" : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === "matches" ? colors.text : colors.textSecondary },
                activeTab === "matches" && styles.tabButtonTextActive,
              ]}
            >
              Matches
            </Text>
            {matches.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  { backgroundColor: activeTab === "matches" ? "#ff7b00" : colors.border },
                ]}
              >
                <Text style={styles.tabBadgeText}>{matches.length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      ) : activeTab === "likes" ? (
        /* ==================== LIKES YOU TAB ==================== */
        likes.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="heart-outline" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Likes Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              When someone likes your profile, they will appear here. Swipe on the discovery feed to boost your visibility!
            </Text>
            <Pressable
              style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.emptyActionBtnText}>Explore Profiles</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={likes}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, shadowColor: colors.shadow },
                ]}
                onPress={() => handleOpenProfile(item)}
              >
                <Image
                  source={{ uri: item.profileImage || "https://placehold.co/400x500" }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.imageGradient}
                />

                {item.isSuperLike && (
                  <View style={styles.superLikeBadge}>
                    <Ionicons name="star" size={11} color="#fff" />
                    <Text style={styles.superLikeBadgeText}>Super Like</Text>
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                    {item.age ? `, ${item.age}` : ""}
                  </Text>
                  {item.location && (
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      <Ionicons name="location-sharp" size={11} color="rgba(255,255,255,0.8)" />{" "}
                      {item.location}
                    </Text>
                  )}
                </View>

                <View style={[styles.cardActions, { backgroundColor: colors.surface }]}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePass(item);
                    }}
                    disabled={busyId === item.id}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.accent }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLikeBack(item);
                    }}
                    disabled={busyId === item.id}
                  >
                    {busyId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="heart" size={20} color="#fff" />
                    )}
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )
      ) : (
        /* ==================== MATCHES TAB ==================== */
        matches.length === 0 ? (
          <View style={styles.center}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="sparkles-outline" size={48} color="#ff7b00" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              When you both like each other, you form a match! Check your &quot;Likes You&quot; tab or discover more people.
            </Text>
            <Pressable
              style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.emptyActionBtnText}>Find Matches</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, shadowColor: colors.shadow },
                ]}
                onPress={() => handleOpenProfile(item)}
              >
                <Image
                  source={{ uri: item.profileImage || "https://placehold.co/400x500" }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.75)"]}
                  style={styles.imageGradient}
                />

                <View style={styles.matchBadge}>
                  <Ionicons name="heart" size={11} color="#fff" />
                  <Text style={styles.matchBadgeText}>Match</Text>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                    {item.age ? `, ${item.age}` : ""}
                  </Text>
                  {item.profession ? (
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {item.profession}
                    </Text>
                  ) : item.location ? (
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      <Ionicons name="location-sharp" size={11} color="rgba(255,255,255,0.8)" />{" "}
                      {item.location}
                    </Text>
                  ) : null}
                </View>

                {/* Direct Message Button */}
                <View style={[styles.cardActions, { backgroundColor: colors.surface }]}>
                  <Pressable
                    style={[styles.messageButton, { backgroundColor: colors.accent }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenChat(item);
                    }}
                    disabled={messagingUserId === item.userId}
                  >
                    {messagingUserId === item.userId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                        <Text style={styles.messageButtonText}>Chat</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabBarTrack: {
    flexDirection: "row",
    borderRadius: radius.full,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radius.full,
    gap: 6,
  },
  tabButtonActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tabButtonTextActive: {
    fontWeight: "700",
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.full,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
  },
  emptyActionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  grid: {
    padding: 12,
    paddingBottom: 24,
  },
  row: {
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 0.88,
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 50,
    height: 70,
  },
  superLikeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3A86FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  superLikeBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  matchBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF7B00",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  cardInfo: {
    position: "absolute",
    bottom: 54,
    left: 8,
    right: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardLocation: {
    fontSize: 11,
    marginTop: 2,
    color: "rgba(255, 255, 255, 0.9)",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 8,
    alignItems: "center",
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
