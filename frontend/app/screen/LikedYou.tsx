import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getLikedByMe, likeProfile, passProfile, LikedByProfile } from "@/services/matchService";
import { showMatchCelebration } from "@/src/components/GlobalMatchCelebration";

export default function LikedYou() {
  const router = useRouter();
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<LikedByProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getLikedByMe();
      setProfiles(data);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to load", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleLikeBack = async (profile: LikedByProfile) => {
    setBusyId(profile.id);
    try {
      const response = await likeProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
      if (response?.match) {
        showMatchCelebration({
          userName: profile.name,
          userAvatar: profile.profileImage,
          otherUserId: profile.userId,
        });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to like back", text2: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const handlePass = async (profile: LikedByProfile) => {
    setBusyId(profile.id);
    try {
      await passProfile(profile.id);
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to pass", text2: error.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleBack = () => router.back();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Who Liked You</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No likes yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            When someone likes your profile, they&apos;ll show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Image
                source={{ uri: item.profileImage || "https://placehold.co/300x300" }}
                style={styles.cardImage}
              />
              {item.isSuperLike && (
                <View style={styles.superLikeBadge}>
                  <Ionicons name="star" size={12} color="#fff" />
                  <Text style={styles.superLikeBadgeText}>Super Like</Text>
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                  {item.age ? `, ${item.age}` : ""}
                </Text>
                {item.location && (
                  <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                )}
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => handlePass(item)}
                  disabled={busyId === item.id}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.likeButton, { backgroundColor: colors.accent }]}
                  onPress={() => handleLikeBack(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="heart" size={20} color="#fff" />
                  )}
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: "center" },
  grid: { padding: 12 },
  row: { gap: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 0.85,
  },
  superLikeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4A90E2",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  superLikeBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardInfo: { padding: 10, paddingBottom: 6 },
  cardName: { fontSize: 15, fontWeight: "700" },
  cardLocation: { fontSize: 12, marginTop: 2 },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    paddingTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  likeButton: {},
});
