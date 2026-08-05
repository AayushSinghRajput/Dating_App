import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { createOrGetChat } from "@/utils/api";
import { useTheme } from "@/contexts/ThemeContext";

// Define TypeScript interfaces for better type safety
interface User {
  id: string;
  name: string;
  age?: number;
  avatar?: string;
  location?: string;
  profession?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  bio?: string;
  gender?: string;
  interestedIn?: string;
  hobbies?: string[];
  education?: string;
  relationshipGoals?: string;
  compatibility?: number;
  distance?: number;
  profileImage: string;
  chatId: string;
  userId?: string;
}

export default function UserDetail() {
  const params = useLocalSearchParams();
  const user = params.user ? (JSON.parse(params.user as string) as User) : null;
  const router = useRouter();
  const { colors } = useTheme();

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>User not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleLike = () => {
    console.log("Liked user:", user.id);
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
          otherUserId: user.userId || user.id,
        },
      });
    } catch (error) {
      console.error("Failed to open chat:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Image Section */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              user.profileImage ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
          }}
          style={styles.avatar}
        />

        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={handleBack}>
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <Pressable style={styles.headerActionButton} onPress={handleLike}>
            <LinearGradient
              colors={["#FF6B6B", "#FF8E8E"]}
              style={styles.likeButton}
            >
              <Ionicons name="heart" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.headerActionButton} onPress={handleMessage}>
            <LinearGradient
              colors={["#4A90E2", "#6AA8FF"]}
              style={styles.messageButton}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.3)"]}
          style={styles.headerOverlay}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info Card */}
        <View style={[styles.mainInfoCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.nameSection}>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.name}
              {user.age && <Text style={[styles.age, { color: colors.textSecondary }]}>, {user.age}</Text>}
            </Text>

            {/* Verification Badge */}
            {user.isVerified && (
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#4A90E2" />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Ionicons name="location-outline" size={16} color={colors.accent} />
            <Text style={[styles.location, { color: colors.accent }]}>{user.location}</Text>
          </View>

          {/* Profession */}
          {user.profession && (
            <View style={styles.professionSection}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.profession, { color: colors.textSecondary }]}>{user.profession}</Text>
            </View>
          )}

          {/* Online Status */}
          {user.isOnline && (
            <View style={styles.onlineStatus}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={styles.onlineText}>Online now</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{user.bio}</Text>
          </View>
        )}

        {/* Personal Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Info</Text>
          </View>

          <View style={styles.infoGrid}>
            {user.gender && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="male-female-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Gender</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.gender}</Text>
              </View>
            )}

            {user.interestedIn && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Interested In</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.interestedIn}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hobbies */}
        {user.hobbies && user.hobbies.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="game-controller-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Hobbies & Interests</Text>
            </View>
            <View style={styles.hobbiesContainer}>
              {user.hobbies.map((hobby: string, index: number) => (
                <View key={index} style={[styles.hobbyTag, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={[styles.hobbyText, { color: colors.accent }]}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education & Goals */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education & Goals</Text>
          </View>

          <View style={styles.infoGrid}>
            {user.education && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="school" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Education</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.education}</Text>
              </View>
            )}

            {user.relationshipGoals && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Relationship Goals</Text>
                </View>
                <Text style={[styles.infoValue, { color: colors.text }]}>{user.relationshipGoals}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Additional Info */}
        {(user.compatibility || user.distance) && (
          <View style={styles.statsSection}>
            {user.compatibility && (
              <View style={styles.statItem}>
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E8E"]}
                  style={styles.statCircle}
                >
                  <Text style={styles.statValue}>{user.compatibility}%</Text>
                </LinearGradient>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Match</Text>
              </View>
            )}

            {user.distance && (
              <View style={styles.statItem}>
                <View style={[styles.statCircle, styles.distanceCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="location" size={20} color="#4A90E2" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{user.distance}km away</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    height: 400,
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  headerActions: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    gap: 12,
  },
  headerActionButton: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  likeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  messageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    marginTop: -40,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  mainInfoCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
  },
  age: {
    fontSize: 24,
    fontWeight: "600",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: "#E3F2FD",
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A90E2",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  location: {
    fontSize: 16,
    fontWeight: "600",
  },
  professionSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  profession: {
    fontSize: 15,
    fontWeight: "500",
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: "#F0F9F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F5E8",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },
  section: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  hobbiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hobbyTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
  },
  hobbyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginTop: 10,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  distanceCircle: {
    borderWidth: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
