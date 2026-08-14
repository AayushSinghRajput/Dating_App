import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { createOrGetChat } from "@/services/chatService";
import { blockUserApi, DiscoveryProfile } from "@/services/profileService";
import { reportUserApi } from "@/services/reportService";
import { likeProfile } from "@/services/matchService";
import { useTheme } from "@/contexts/ThemeContext";
import { showReportReasonPicker } from "@/src/utils/reportFlow";
import { showActionSheet } from "@/src/components/GlobalActionSheet";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";
import Badge from "@/src/components/ui/Badge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BLURHASH = "L5H2EC=PM+yV0g-mq.wG9c010J}I";

export default function UserDetail() {
  const params = useLocalSearchParams();
  const user = params.user ? (JSON.parse(params.user as string) as DiscoveryProfile) : null;
  const router = useRouter();
  const { colors } = useTheme();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  const photos =
    user?.photos && user.photos.length > 0
      ? user.photos
      : [user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop"];

  const handlePhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePhotoIndex(index);
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>User not found</Text>
      </View>
    );
  }

  const handleBack = () => router.back();

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    try {
      const response = await likeProfile(user.id);
      // On a match, both users get a real-time "match" notification that
      // triggers the full-screen celebration — nothing extra needed here.
      if (!response?.match) {
        Toast.show({ type: "info", text1: "Profile Liked ❤️", text2: `You liked ${user.name || "this user"}.` });
      }
    } catch (error: any) {
      setLiked(false);
      Toast.show({ type: "error", text1: "Failed to like profile", text2: error.message });
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
          otherUserId: user.userId || user.id,
        },
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to open chat", text2: error.message });
    }
  };

  const handleReplyToPrompt = async (question: string, answer: string) => {
    try {
      const chat = await createOrGetChat(user.userId || user.id);
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: user.name,
          avatar: user.profileImage,
          otherUserId: user.userId || user.id,
          prefill: `"${question}"\n"${answer}"\n\n`,
        },
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to open chat", text2: error.message });
    }
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      `Block ${user.name || "this user"}? They won't be able to see your profile, message you, or call you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await blockUserApi(user.userId || user.id);
              Toast.show({ type: "success", text1: `${user.name} has been blocked` });
              router.back();
            } catch (error: any) {
              Toast.show({ type: "error", text1: "Failed to block user", text2: error.message });
            }
          },
        },
      ],
    );
  };

  const handleReport = () => {
    showReportReasonPicker(user.name || "this user", async (reason) => {
      try {
        await reportUserApi(user.userId || user.id, reason);
        Toast.show({ type: "success", text1: "Report submitted" });
        router.back();
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Failed to submit report", text2: error.message });
      }
    });
  };

  const handleMoreOptions = () => {
    showActionSheet({
      title: user.name || "Options",
      options: [
        { label: "Report User", destructive: true, onPress: handleReport },
        { label: "Block User", destructive: true, onPress: handleBlock },
      ],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Image Section */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePhotoScroll}
        >
          {photos.map((uri, index) => (
            <Image
              key={uri + index}
              source={{ uri }}
              style={[styles.photo, { width: SCREEN_WIDTH }]}
              contentFit="cover"
              placeholder={{ blurhash: BLURHASH }}
              transition={200}
              cachePolicy="disk"
            />
          ))}
        </ScrollView>

        {photos.length > 1 && (
          <View style={styles.photoDots}>
            {photos.map((_, index) => (
              <View key={index} style={[styles.photoDot, index === activePhotoIndex && styles.photoDotActive]} />
            ))}
          </View>
        )}

        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]} style={styles.backButtonGradient}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerActionButton}
            onPress={handleLike}
            disabled={liked}
            accessibilityRole="button"
            accessibilityLabel={`Like ${user.name || "this user"}`}
            accessibilityState={{ disabled: liked }}
          >
            <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={[styles.circleButton, liked && styles.circleButtonDisabled]}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.headerActionButton}
            onPress={handleMessage}
            accessibilityRole="button"
            accessibilityLabel={`Message ${user.name || "this user"}`}
          >
            <LinearGradient colors={[colors.info, "#6AA8FF"]} style={styles.circleButton}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.headerActionButton}
            onPress={handleMoreOptions}
            accessibilityRole="button"
            accessibilityLabel="More options"
          >
            <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]} style={styles.circleButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

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
            <Text style={[typography.h1, styles.name, { color: colors.text }]}>{user.name}</Text>
            {user.isVerified && <Badge label="Verified" icon="checkmark-circle" tone="info" />}
          </View>

          {user.profession && (
            <View style={styles.professionSection}>
              <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
              <Text style={[typography.body, { color: colors.textSecondary }]}>{user.profession}</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {user.aboutMe && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.accent} />
              <Text style={[typography.h3, { color: colors.text }]}>About Me</Text>
            </View>
            <Text style={[typography.body, styles.sectionContent, { color: colors.textSecondary }]}>
              {user.aboutMe}
            </Text>
          </View>
        )}

        {/* Prompts — reply directly to one instead of a cold "hi" */}
        {user.prompts && user.prompts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.accent} />
              <Text style={[typography.h3, { color: colors.text }]}>Prompts</Text>
            </View>
            {user.prompts.map((prompt, index) => (
              <View
                key={prompt.question}
                style={[
                  styles.promptCard,
                  { backgroundColor: colors.accentSoft },
                  index > 0 && { marginTop: spacing.md },
                ]}
              >
                <Text style={[typography.label, { color: colors.accent }]}>{prompt.question}</Text>
                <Text style={[typography.body, styles.promptAnswer, { color: colors.text }]}>
                  {prompt.answer}
                </Text>
                <Pressable
                  style={[styles.replyButton, { backgroundColor: colors.accent }]}
                  onPress={() => handleReplyToPrompt(prompt.question, prompt.answer)}
                  accessibilityRole="button"
                  accessibilityLabel={`Reply to ${user.name || "this user"}'s prompt`}
                >
                  <Ionicons name="arrow-undo" size={14} color="#fff" />
                  <Text style={styles.replyButtonText}>Reply</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Personal Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
            <Text style={[typography.h3, { color: colors.text }]}>Personal Info</Text>
          </View>

          <View style={styles.infoGrid}>
            {user.age && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Age</Text>
                </View>
                <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>{user.age}</Text>
              </View>
            )}

            {user.location && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Location</Text>
                </View>
                <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>{user.location}</Text>
              </View>
            )}

            {user.gender && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="male-female-outline" size={16} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Gender</Text>
                </View>
                <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>{user.gender}</Text>
              </View>
            )}

            {user.interestedIn && (
              <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                  <Text style={[typography.label, { color: colors.textSecondary }]}>Interested In</Text>
                </View>
                <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>{user.interestedIn}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hobbies */}
        {user.hobbies && user.hobbies.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="game-controller-outline" size={20} color={colors.accent} />
              <Text style={[typography.h3, { color: colors.text }]}>Hobbies & Interests</Text>
            </View>
            <View style={styles.hobbiesContainer}>
              {user.hobbies.map((hobby: string, index: number) => (
                <View
                  key={index}
                  style={[styles.hobbyTag, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}
                >
                  <Text style={[typography.bodySmall, styles.hobbyText, { color: colors.accent }]}>{hobby}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education & Goals */}
        {(user.education || user.relationshipGoals) && (
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={20} color={colors.accent} />
              <Text style={[typography.h3, { color: colors.text }]}>Education & Goals</Text>
            </View>

            <View style={styles.infoGrid}>
              {user.education && (
                <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="school" size={16} color={colors.textSecondary} />
                    <Text style={[typography.label, { color: colors.textSecondary }]}>Education</Text>
                  </View>
                  <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>{user.education}</Text>
                </View>
              )}

              {user.relationshipGoals && (
                <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
                  <View style={styles.infoLabel}>
                    <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
                    <Text style={[typography.label, { color: colors.textSecondary }]}>Relationship Goals</Text>
                  </View>
                  <Text style={[typography.body, styles.infoValue, { color: colors.text }]}>
                    {user.relationshipGoals}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { height: 400, position: "relative" },
  photo: { height: "100%" },
  photoDots: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
    zIndex: 10,
  },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
  photoDotActive: { backgroundColor: "#fff", width: 18 },
  backButton: { position: "absolute", top: 50, left: spacing.xl, zIndex: 10 },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    position: "absolute",
    top: 50,
    right: spacing.xl,
    zIndex: 10,
    flexDirection: "row",
    gap: spacing.md,
  },
  headerActionButton: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  circleButton: { width: 50, height: 50, borderRadius: radius.full, justifyContent: "center", alignItems: "center" },
  circleButtonDisabled: { opacity: 0.7 },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { flex: 1, marginTop: -40 },
  contentContainer: { paddingBottom: spacing.xxl },
  mainInfoCard: {
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  name: { flexShrink: 1 },
  professionSection: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  section: {
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  sectionContent: { lineHeight: 22 },
  infoGrid: { gap: spacing.lg },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  infoValue: { textAlign: "right", flex: 1 },
  hobbiesContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  hobbyTag: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  hobbyText: { fontWeight: "600" },
  promptCard: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  promptAnswer: { marginTop: spacing.xs, marginBottom: spacing.md },
  replyButton: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  replyButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
