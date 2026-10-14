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
import { useLanguage } from "@/contexts/LanguageContext";
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
import TabSwipeWrapper from "@/src/components/TabSwipeWrapper";
import { radius } from "@/src/theme/radius";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

type ActiveTab = "likes" | "matches";

export default function LikesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
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
        ? `${likes.length} ${likes.length === 1 ? t("likes.personLikedYou", "person liked you") : t("likes.peopleLikedYou", "people liked you")}`
        : undefined
      : matches.length > 0
      ? `${matches.length} ${matches.length === 1 ? t("likes.mutualMatch", "mutual match") : t("likes.mutualMatches", "mutual matches")}`
      : undefined;

  return (
    <TabSwipeWrapper leftTab="/(tabs)/chat" rightTab="/(tabs)">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t("likes.title", "Likes & Matches")} subtitle={subtitle} />

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
              {t("likes.likesYou", "Likes You")}
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
              {t("likes.matches", "Matches")}
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("likes.noLikesYet", "No Likes Yet")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("likes.noLikesYetDesc", "When someone likes your profile, they will appear here. Swipe on the discovery feed to boost your visibility!")}
            </Text>
            <Pressable
              style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.emptyActionBtnText}>
                {t("discovery.exploreProfiles", "Explore Profiles")}
              </Text>
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t("likes.noMatchesYet", "No Matches Yet")}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("likes.noMatchesYetDesc", "When you both like each other, you form a match! Check your \"Likes You\" tab or discover more people.")}
            </Text>
            <Pressable
              style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push("/(tabs)")}
            >
              <Ionicons name="flame" size={18} color="#fff" />
              <Text style={styles.emptyActionBtnText}>
                {t("likes.findMatches", "Find Matches")}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            key="matches-list-1col"
            data={matches}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.matchesListContainer}
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
                  styles.matchCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => handleOpenProfile(item)}
              >
                <View style={styles.matchImageContainer}>
                  <Image
                    source={{ uri: item.profileImage || "https://placehold.co/600x800" }}
                    style={styles.matchCardImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.matchImageGradient}
                  />

                  {/* Match Pill Badge */}
                  <View style={styles.matchPillBadge}>
                    <Ionicons name="sparkles" size={12} color="#ffffff" />
                    <Text style={styles.matchPillText}>Mutual Match</Text>
                  </View>

                  {/* Text Overlay on Photo */}
                  <View style={styles.matchCardOverlay}>
                    <Text style={styles.matchCardName} numberOfLines={1}>
                      {item.name}
                      {item.age ? `, ${item.age}` : ""}
                    </Text>

                    <View style={styles.matchMetaRow}>
                      {item.location && (
                        <View style={styles.matchMetaItem}>
                          <Ionicons name="location-sharp" size={13} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.matchMetaText} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      )}
                      {item.profession && (
                        <View style={styles.matchMetaItem}>
                          <Ionicons name="briefcase" size={12} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.matchMetaText} numberOfLines={1}>
                            {item.profession}
                          </Text>
                        </View>
                      )}
                    </View>

                    {item.aboutMe ? (
                      <Text style={styles.matchCardAbout} numberOfLines={2}>
                        &ldquo;{item.aboutMe}&rdquo;
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Bottom Action Footer */}
                <View style={[styles.matchCardActions, { backgroundColor: colors.surface }]}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.matchChatButton,
                      { backgroundColor: colors.accent },
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenChat(item);
                    }}
                    disabled={messagingUserId === item.userId}
                  >
                    {messagingUserId === item.userId ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
                        <Text style={styles.matchChatButtonText}>
                          {t("likes.startChat", "Send Message")}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.matchProfileBtn,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenProfile(item);
                    }}
                  >
                    <Ionicons name="person-outline" size={18} color={colors.text} />
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        )
      )}
      </View>
    </TabSwipeWrapper>
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
  matchesListContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  matchCard: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  matchImageContainer: {
    width: "100%",
    height: 320,
    position: "relative",
  },
  matchCardImage: {
    width: "100%",
    height: "100%",
  },
  matchImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  matchPillBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(230, 57, 70, 0.9)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  matchPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  matchCardOverlay: {
    position: "absolute",
    bottom: 14,
    left: 16,
    right: 16,
    gap: 4,
  },
  matchCardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  matchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 2,
  },
  matchMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  matchMetaText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  matchCardAbout: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 12.5,
    fontStyle: "italic",
    lineHeight: 17,
    marginTop: 4,
  },
  matchCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    paddingHorizontal: 14,
  },
  matchChatButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  matchChatButtonText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
  matchProfileBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
