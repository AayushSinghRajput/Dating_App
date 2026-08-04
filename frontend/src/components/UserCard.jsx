import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  toggleFavorite,
  getFavorites,
  likeProfile,
  passProfile,
  getMatches,
  createOrGetChat,
} from "@/utils/api";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function UserCard({ user, index = 0 }) {
  const [favorite, setFavorite] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const [loggedInUserFavorites, setLoggedInUserFavorites] = useState([]);
  const router = useRouter();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const favoriteScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const delay = index * 120;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    router.push({
      pathname: "/screen/UserDetail/[userId]",
      params: {
        user: JSON.stringify(user),
        userId: user.id,
      },
    });
  };

  const fetchFavorites = async () => {
    try {
      const favoritesList = await getFavorites();
      const ids = favoritesList.map((f) => f._id);
      setLoggedInUserFavorites(ids);
      setFavorite(ids.includes(user.id));
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      setFavorite(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  useEffect(() => {
    if (user?.id && loggedInUserFavorites.length > 0) {
      setFavorite(loggedInUserFavorites.includes(user.id));
    }
  }, [loggedInUserFavorites, user]);

  const handleFavorite = async () => {
    if (loadingFavorite || favorite === null) return;
    setLoadingFavorite(true);

    Animated.sequence([
      Animated.timing(favoriteScale, {
        toValue: 1.4,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(favoriteScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const previousFavorite = favorite;
    setFavorite(!previousFavorite);

    try {
      const result = await toggleFavorite(user.id);
      if (result?.favorites && Array.isArray(result.favorites)) {
        const updatedFavorites = result.favorites.map((f) =>
          typeof f === "object" ? f._id?.toString() : f.toString()
        );
        setLoggedInUserFavorites(updatedFavorites);
        setFavorite(updatedFavorites.includes(user.id.toString()));
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

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
      age--;
    return age;
  };

  const getOnlineStatus = () => {
    if (user?.isOnline) return "Online now";
    if (user?.lastSeen) {
      const lastSeen = new Date(user.lastSeen);
      const now = new Date();
      const diffInHours = Math.floor((now - lastSeen) / (1000 * 60 * 60));
      if (diffInHours < 1) return "Active recently";
      if (diffInHours < 24) return `Active ${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `Active ${diffInDays}d ago`;
    }
    return null;
  };

  const age = calculateAge(user?.birthDate);
  const onlineStatus = getOnlineStatus();

  /** ✅ Handles Like Action and Match Fetch */
  const handleLike = async () => {
    try {
      const response = await likeProfile(user.id);

      if (response?.match) {
        Toast.show({
          type: "success",
          text1: "It's a Match! 🎉",
          text2:
            "You and " + (user?.name || "this user") + " liked each other.",
          position: "top",
          visibilityTime: 3000,
        });

        // 🧠 Trigger match fetch when both liked each other
        await fetchMatches();
      } else {
        Toast.show({
          type: "info",
          text1: "Profile Liked ❤️",
          text2: "You liked " + (user?.name || "this user") + ".",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to like profile. Try again.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  /** ✅ Handles Pass (Skip) */
  const handlePass = async () => {
    try {
      const res = await passProfile(user.id);
      Toast.show({
        type: "info",
        text1: "Profile Passed 👋",
        text2:
          res.message ||
          `You have passed ${user?.name || "this user"}'s profile.`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (err) {
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
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to open chat.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  /** ✅ Fetch Matches when both liked */
  const fetchMatches = async () => {
    try {
      const matches = await getMatches();
      Toast.show({
        type: "success",
        text1: "New Match Found 🎉",
        text2: `You have ${matches.length} matches now!`,
        position: "top",
        visibilityTime: 3000,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to fetch matches.",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <Pressable onPress={handlePress} style={styles.pressableArea}>
        <View style={styles.card}>
          {/* IMAGE SECTION */}
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri:
                  user?.profileImage ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
              }}
              style={styles.avatar}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageOverlay}
            />
            {!imageLoaded && (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={50} color="#E8E8E8" />
              </View>
            )}
            <Animated.View
              style={[
                styles.favoriteIcon,
                { transform: [{ scale: favoriteScale }] },
              ]}
            >
              <Pressable onPress={handleFavorite} style={styles.favoriteButton}>
                <Ionicons
                  name={favorite ? "star" : "star-outline"}
                  size={22}
                  color={favorite ? "#FFD700" : "#fff"}
                />
              </Pressable>
            </Animated.View>
          </View>

          {/* INFO SECTION */}
          <View style={styles.infoWrapper}>
            <Text style={styles.name}>{user?.name || "Unknown"}</Text>
            {age && <Text style={styles.age}>{age}</Text>}
            <Text style={styles.location}>
              {user?.location || "Location not specified"}
            </Text>

            {/* ACTION BUTTONS */}
            <View style={styles.actionButtons}>
              <Pressable onPress={handlePass} style={styles.passButton}>
                <Ionicons name="close" size={24} color="#FF6B6B" />
              </Pressable>

              <Pressable onPress={handleLike} style={styles.likeButton}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E8E"]}
                  style={styles.likeButtonGradient}
                >
                  <Ionicons name="heart" size={20} color="#fff" />
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleMessage} style={styles.messageButton}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={20}
                  color="#4A90E2"
                />
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
  cardWrapper: { alignItems: "center", marginVertical: 10 },
  pressableArea: { borderRadius: 28 },
  card: {
    width: width * 0.88,
    height: 480,
    borderRadius: 28,
    backgroundColor: "#fff",
    elevation: 12,
    overflow: "hidden",
  },
  imageWrapper: { flex: 1, position: "relative" },
  avatar: { width: "100%", height: "100%", resizeMode: "cover" },
  imageOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  imagePlaceholder: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  favoriteIcon: { position: "absolute", top: 16, right: 16 },
  favoriteButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 10,
  },
  infoWrapper: { padding: 16 },
  name: { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  age: { fontSize: 18, color: "#555" },
  location: { color: "#888", marginTop: 4 },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  passButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5E5",
  },
  likeButton: { borderRadius: 26, overflow: "hidden" },
  likeButtonGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8F4FF",
  },
});
