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
  chatId:string;
}

export default function UserDetail() {
  const params = useLocalSearchParams();
  const user = params.user ? (JSON.parse(params.user as string) as User) : null;
  const router = useRouter();

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

  const handleMessage = () => {
    // console.log("Message user:", user.id);
    router.push({
      pathname: "/screen/ChatDetail/[chatId]",
      params: {
        chatId: user?.chatId || user?.id,
        name: user.name,
        avatar: user.profileImage,
      },
    });
  };

  return (
    <View style={styles.container}>
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
        <View style={styles.mainInfoCard}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>
              {user.name}
              {user.age && <Text style={styles.age}>, {user.age}</Text>}
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
            <Ionicons name="location-outline" size={16} color="#FF6B6B" />
            <Text style={styles.location}>{user.location}</Text>
          </View>

          {/* Profession */}
          {user.profession && (
            <View style={styles.professionSection}>
              <Ionicons name="briefcase-outline" size={16} color="#666" />
              <Text style={styles.profession}>{user.profession}</Text>
            </View>
          )}

          {/* Online Status */}
          {user.isOnline && (
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online now</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.sectionContent}>{user.bio}</Text>
          </View>
        )}

        {/* Personal Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Personal Info</Text>
          </View>

          <View style={styles.infoGrid}>
            {user.gender && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <Ionicons name="male-female-outline" size={16} color="#666" />
                  <Text style={styles.infoTitle}>Gender</Text>
                </View>
                <Text style={styles.infoValue}>{user.gender}</Text>
              </View>
            )}

            {user.interestedIn && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <Ionicons name="heart-outline" size={16} color="#666" />
                  <Text style={styles.infoTitle}>Interested In</Text>
                </View>
                <Text style={styles.infoValue}>{user.interestedIn}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hobbies */}
        {user.hobbies && user.hobbies.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="game-controller-outline"
                size={20}
                color="#FF6B6B"
              />
              <Text style={styles.sectionTitle}>Hobbies & Interests</Text>
            </View>
            <View style={styles.hobbiesContainer}>
              {user.hobbies.map((hobby: string, index: number) => (
                <View key={index} style={styles.hobbyTag}>
                  <Ionicons name="star" size={14} color="#FF6B6B" />
                  <Text style={styles.hobbyText}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education & Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school-outline" size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Education & Goals</Text>
          </View>

          <View style={styles.infoGrid}>
            {user.education && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <Ionicons name="school" size={16} color="#666" />
                  <Text style={styles.infoTitle}>Education</Text>
                </View>
                <Text style={styles.infoValue}>{user.education}</Text>
              </View>
            )}

            {user.relationshipGoals && (
              <View style={styles.infoItem}>
                <View style={styles.infoLabel}>
                  <Ionicons name="flag-outline" size={16} color="#666" />
                  <Text style={styles.infoTitle}>Relationship Goals</Text>
                </View>
                <Text style={styles.infoValue}>{user.relationshipGoals}</Text>
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
                <Text style={styles.statLabel}>Match</Text>
              </View>
            )}

            {user.distance && (
              <View style={styles.statItem}>
                <View style={[styles.statCircle, styles.distanceCircle]}>
                  <Ionicons name="location" size={20} color="#4A90E2" />
                </View>
                <Text style={styles.statLabel}>{user.distance}km away</Text>
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
    backgroundColor: "#f8f9fa",
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
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#1a1a1a",
    letterSpacing: -0.5,
    flex: 1,
  },
  age: {
    fontSize: 24,
    fontWeight: "600",
    color: "#666",
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
    color: "#FF6B6B",
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
    color: "#666",
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
    backgroundColor: "#4CAF50",
  },
  onlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#1a1a1a",
  },
  sectionContent: {
    fontSize: 15,
    color: "#555",
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
    borderBottomColor: "#f5f5f5",
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
    color: "#666",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
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
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  hobbyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF6B6B",
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
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E8F4FF",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
});
