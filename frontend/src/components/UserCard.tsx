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

interface UserCardProps {
  user: DiscoveryProfile;
  index?: number;
}

export default function UserCard({ user, index = 0 }: UserCardProps) {
  const { colors } = useTheme();
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loggedInUserFavorites, setLoggedInUserFavorites] = useState<string[]>([]);
  const router = useRouter();

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
  }, [index]);

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

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={styles.pressableArea}
        accessibilityRole="button"
        accessibilityLabel={`View ${user?.name || "this user"}'s profile`}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {/* IMAGE SECTION */}
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
              }}
              style={styles.avatar}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              transition={250}
              cachePolicy="disk"
            />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageOverlay} />

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
          </View>

          {/* INFO SECTION */}
          <View style={styles.infoWrapper}>
            <View style={styles.nameRow}>
              <Text style={[typography.h2, styles.name, { color: colors.text }]} numberOfLines={1}>
                {user?.name || "Unknown"}
              </Text>
              {user?.isVerified && <Badge label="Verified" icon="checkmark-circle" tone="info" />}
            </View>
            {user.age && <Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>{user.age}</Text>}
            <Text style={[typography.body, styles.location, { color: colors.textTertiary }]} numberOfLines={1}>
              {user?.location || "Location not specified"}
            </Text>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={handlePass}
                style={[styles.passButton, { backgroundColor: colors.surface, borderColor: colors.accentSoft }]}
                accessibilityRole="button"
                accessibilityLabel={`Pass on ${user?.name || "this user"}`}
              >
                <Ionicons name="close" size={24} color={colors.accent} />
              </Pressable>

              <Pressable
                onPress={handleSuperLike}
                style={[styles.superLikeButton, { backgroundColor: colors.surface, borderColor: colors.info + "33" }]}
                accessibilityRole="button"
                accessibilityLabel={`Super like ${user?.name || "this user"}`}
              >
                <Ionicons name="star" size={20} color={colors.info} />
              </Pressable>

              <Pressable
                onPress={handleLike}
                style={styles.likeButton}
                accessibilityRole="button"
                accessibilityLabel={`Like ${user?.name || "this user"}`}
              >
                <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.likeButtonGradient}>
                  <Ionicons name="heart" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handleMessage}
                style={[styles.messageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={`Message ${user?.name || "this user"}`}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.info} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* --- STYLES --- */
const styles = StyleSheet.create({
  cardWrapper: { alignItems: "center", marginVertical: spacing.sm },
  pressableArea: { borderRadius: radius.xl },
  card: {
    width: width * 0.88,
    height: 480,
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  imageWrapper: { flex: 1, position: "relative" },
  avatar: { width: "100%", height: "100%" },
  imageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  favoriteIcon: { position: "absolute", top: spacing.lg, right: spacing.lg },
  favoriteButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: radius.full,
    padding: spacing.md,
  },
  infoWrapper: { padding: spacing.lg },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { flexShrink: 1 },
  location: { marginTop: spacing.xs },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  superLikeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  passButton: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  likeButton: { borderRadius: radius.full, overflow: "hidden" },
  likeButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
});
