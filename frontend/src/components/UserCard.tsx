import { View, Text, StyleSheet, Pressable, Dimensions, Animated } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { toggleFavorite, getFavorites, DiscoveryProfile } from "@/services/profileService";
import { likeProfile, superLikeProfile, passProfile } from "@/services/matchService";
import { createOrGetChat } from "@/services/chatService";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";
import Badge from "@/src/components/ui/Badge";

const { width } = Dimensions.get("window");
const BLURHASH = "L5H2EC=PM+yV0g-mq.wG9c010J}I";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400";

interface UserCardProps {
  user: DiscoveryProfile;
  index?: number;
}

export default function UserCard({ user, index = 0 }: UserCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loggedInUserFavorites, setLoggedInUserFavorites] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [replying, setReplying] = useState(false);

  const photos = user.photos && user.photos.length > 0 ? user.photos : [user.profileImage || FALLBACK_IMAGE];

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const favoriteScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 120;
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay, useNativeDriver: true }),
    ]).start();
  }, [index, fadeAnim, scaleAnim, slideAnim]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    router.push({
      pathname: "/screen/UserDetail/[userId]",
      params: { user: JSON.stringify(user), userId: user.id },
    });
  };

  const goToPrevPhoto = () => setActivePhotoIndex((prev) => Math.max(0, prev - 1));
  const goToNextPhoto = () => setActivePhotoIndex((prev) => Math.min(photos.length - 1, prev + 1));

  const fetchFavorites = async () => {
    try {
      const favoritesList = await getFavorites();
      const ids = favoritesList.map((f: any) => f._id);
      setLoggedInUserFavorites(ids);
      setFavorite(ids.includes(user.userId));
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setFavorite(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (user?.userId && loggedInUserFavorites.length > 0) {
      setFavorite(loggedInUserFavorites.includes(user.userId));
    }
  }, [loggedInUserFavorites, user]);

  const handleFavorite = async () => {
    if (loadingFavorite || favorite === null) return;
    setLoadingFavorite(true);

    Animated.sequence([
      Animated.timing(favoriteScale, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(favoriteScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const previousFavorite = favorite;
    setFavorite(!previousFavorite);

    try {
      const result = await toggleFavorite(user.userId);
      if (result?.favorites && Array.isArray(result.favorites)) {
        const updatedFavorites = result.favorites.map((f: any) =>
          typeof f === "object" ? f._id?.toString() : f.toString()
        );
        setLoggedInUserFavorites(updatedFavorites);
        setFavorite(updatedFavorites.includes(user.userId.toString()));
      } else {
        console.warn("No favorites array returned from backend.");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setFavorite(previousFavorite);
    } finally {
      setLoadingFavorite(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await likeProfile(user.id);

      // On a match, both users get a real-time "match" notification (see
      // matchController.js) which triggers the full-screen celebration from
      // NotificationContext — that covers both people symmetrically, so
      // nothing extra to do here for the match case.
      if (!response?.match) {
        Toast.show({
          type: "info",
          text1: "Profile Liked ❤️",
          text2: "You liked " + (user?.name || "this user") + ".",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to like profile. Try again.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleSuperLike = async () => {
    try {
      const response = await superLikeProfile(user.id);

      if (!response?.match) {
        Toast.show({
          type: "info",
          text1: "Super Like sent ⭐",
          text2: (user?.name || "This user") + " will see you super liked them!",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to send super like.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handlePass = async () => {
    try {
      const res = await passProfile(user.id);
      Toast.show({
        type: "info",
        text1: "Profile Passed 👋",
        text2: res.message || `You have passed ${user?.name || "this user"}'s profile.`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to pass profile.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const handleMessage = async () => {
    try {
      const chat = await createOrGetChat(user.userId || user.id);
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: user.name,
          avatar: user.profileImage,
          currentUserId: user.id,
          otherUserId: user.userId || user.id,
        },
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to open chat.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  // Unique touch: reply to a prompt straight from the discovery card, no
  // detour through the full profile — the fastest possible path from "this
  // looks interesting" to a real, specific first message.
  const handleReplyToPrompt = async () => {
    const prompt = user.prompts?.[0];
    if (!prompt || replying) return;
    setReplying(true);
    try {
      const chat = await createOrGetChat(user.userId || user.id);
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: user.name,
          avatar: user.profileImage,
          otherUserId: user.userId || user.id,
          prefill: `"${prompt.question}"\n"${prompt.answer}"\n\n`,
        },
      });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to open chat", text2: err.message });
    } finally {
      setReplying(false);
    }
  };

  const firstPrompt = user.prompts?.[0];

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        {/* PHOTO SECTION — full bleed */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: photos[activePhotoIndex] }}
            style={styles.avatar}
            contentFit="cover"
            placeholder={{ blurhash: BLURHASH }}
            transition={250}
            cachePolicy="disk"
          />

          {/* Photo progress bars (Tinder/Hinge-style) */}
          {photos.length > 1 && (
            <View style={styles.progressRow} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: "#fff", width: i <= activePhotoIndex ? "100%" : "0%" },
                    ]}
                  />
                </View>
              ))}
            </View>
          )}

          {/* Left/right tap zones to cycle photos — confined to the upper
              part of the image so the bottom info panel stays tappable to
              open the full profile. */}
          {photos.length > 1 && (
            <View style={styles.photoTapZone} pointerEvents="box-none">
              <Pressable style={styles.photoTapHalf} onPress={goToPrevPhoto} />
              <Pressable style={styles.photoTapHalf} onPress={goToNextPhoto} />
            </View>
          )}

          {user.isBoosted && (
            <View style={[styles.boostRibbon, { backgroundColor: colors.accent }]}>
              <Ionicons name="flash" size={12} color="#fff" />
              <Text style={styles.boostRibbonText}>Boosted</Text>
            </View>
          )}

          <Animated.View style={[styles.favoriteIcon, { transform: [{ scale: favoriteScale }] }]}>
            <Pressable
              onPress={handleFavorite}
              style={styles.favoriteButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
              accessibilityState={{ selected: !!favorite }}
            >
              <Ionicons name={favorite ? "star" : "star-outline"} size={22} color={favorite ? "#FFD700" : "#fff"} />
            </Pressable>
          </Animated.View>

          {/* Bottom gradient + info overlay — tapping here opens the full profile */}
          <Pressable
            onPress={handlePress}
            style={styles.infoOverlay}
            accessibilityRole="button"
            accessibilityLabel={`View ${user?.name || "this user"}'s profile`}
          >
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.88)"]} style={styles.gradient} />

            <View style={styles.infoContent}>
              <View style={styles.nameRow}>
                <Text style={[typography.h2, styles.name, { color: "#fff" }]} numberOfLines={1}>
                  {user?.name || "Unknown"}
                  {user.age ? `, ${user.age}` : ""}
                </Text>
                {user?.isVerified && <Badge label="Verified" icon="checkmark-circle" tone="info" />}
              </View>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.location} numberOfLines={1}>
                  {user?.location || "Location not specified"}
                </Text>
              </View>

              {firstPrompt && (
                <Pressable
                  onPress={handleReplyToPrompt}
                  disabled={replying}
                  style={styles.promptChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Reply to ${user?.name || "this user"}'s prompt`}
                >
                  <Ionicons name="chatbubble-ellipses" size={14} color="#fff" />
                  <Text style={styles.promptChipText} numberOfLines={1}>
                    {firstPrompt.answer}
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
                </Pressable>
              )}

              {/* ACTION BUTTONS */}
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={handlePass}
                  style={styles.passButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Pass on ${user?.name || "this user"}`}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={handleSuperLike}
                  style={styles.superLikeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Super like ${user?.name || "this user"}`}
                >
                  <Ionicons name="star" size={18} color={colors.info} />
                </Pressable>

                <Pressable
                  onPress={handleLike}
                  style={styles.likeButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Like ${user?.name || "this user"}`}
                >
                  <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.likeButtonGradient}>
                    <Ionicons name="heart" size={22} color="#fff" />
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleMessage}
                  style={styles.messageButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Message ${user?.name || "this user"}`}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

/* --- STYLES --- */
const styles = StyleSheet.create({
  cardWrapper: { alignItems: "center", marginVertical: spacing.sm },
  card: {
    width: width * 0.9,
    height: 560,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  imageWrapper: { flex: 1, position: "relative" },
  avatar: { width: "100%", height: "100%" },
  progressRow: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  // No explicit zIndex — relies on JSX render order (this is placed before
  // the favorite button and info overlay below) so those interactive
  // elements naturally stack above these tap zones and stay tappable.
  photoTapZone: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "62%",
    flexDirection: "row",
  },
  photoTapHalf: { flex: 1 },
  boostRibbon: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  boostRibbonText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  favoriteIcon: { position: "absolute", top: spacing.xl, right: spacing.lg, zIndex: 10 },
  favoriteButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: radius.full,
    padding: spacing.md,
  },
  infoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  infoContent: { padding: spacing.lg, paddingTop: spacing.xxxl },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flexShrink: 1 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  location: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500" },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  promptChipText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600" },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  superLikeButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  passButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  likeButton: { borderRadius: radius.full, overflow: "hidden" },
  likeButtonGradient: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
});
