import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

type FeedbackCategory = "suggestion" | "compliment" | "bug" | "general";

interface FeedbackCategoryOption {
  id: FeedbackCategory;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: FeedbackCategoryOption[] = [
  {
    id: "suggestion",
    title: "Feature Idea",
    description: "Suggest improvements or new features",
    icon: "bulb",
    color: "#10b981",
  },
  {
    id: "compliment",
    title: "Compliment",
    description: "What you love about Soulmate",
    icon: "heart",
    color: "#e63946",
  },
  {
    id: "bug",
    title: "Bug Report",
    description: "Something is not working as expected",
    icon: "bug",
    color: "#f59e0b",
  },
  {
    id: "general",
    title: "General",
    description: "Other feedback or thoughts",
    icon: "chatbubble-ellipses",
    color: "#0284c7",
  },
];

const QUICK_TOPICS = [
  "Match Discovery",
  "Video & Voice Calls",
  "Chat Messaging",
  "Verified Badges",
  "Location Accuracy",
  "Safety & Privacy",
];

const RATING_LABELS: Record<number, string> = {
  1: "Needs Work 😕",
  2: "Fair, but has issues 😐",
  3: "Good experience 🙂",
  4: "Great app! 😊",
  5: "Loving Soulmate! ❤️",
};

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>("suggestion");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleBack = () => router.back();

  const handleSelectCategory = (cat: FeedbackCategory) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedCategory(cat);
  };

  const handleStarPress = (star: number) => {
    Haptics.selectionAsync().catch(() => {});
    setRating(star);
  };

  const handleTopicPress = (topic: string) => {
    Haptics.selectionAsync().catch(() => {});
    setFeedback((prev) => {
      const prefix = prev.trim() ? `${prev.trim()}\n` : "";
      return `${prefix}[Topic: ${topic}] `;
    });
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Feedback Required",
        text2: "Please enter your feedback before submitting.",
      });
      return;
    }

    if (feedback.trim().length < 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Toast.show({
        type: "error",
        text1: "More Detail Needed",
        text2: "Please provide at least 10 characters so we can understand your feedback.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsSubmitting(true);

    try {
      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSubmittedSuccess(true);
      Toast.show({
        type: "success",
        text1: "Feedback Received!",
        text2: "Thank you for helping us improve Soulmate for everyone.",
      });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Submission Failed",
        text2: "Could not send feedback. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = feedback.length;
  const maxCharacters = 1000;

  // Render Success Screen upon submission
  if (submittedSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DetailHeader title="Send Feedback" onBack={handleBack} />

        <View style={styles.successContainer}>
          <View style={styles.successIconOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.successGradient}
            >
              <Ionicons name="heart" size={44} color="#ffffff" />
            </LinearGradient>
          </View>

          <View style={[styles.successPill, { backgroundColor: "#d1fae5" }]}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={[styles.successPillText, { color: "#065f46" }]}>
              RECEIVED BY SOULMATE TEAM
            </Text>
          </View>

          <Text style={[styles.successTitle, { color: colors.text }]}>
            Thank You for Caring!
          </Text>
          <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
            Your insights directly help our engineering and design teams build a safer, more intuitive dating experience for singles everywhere.
          </Text>

          <Pressable
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneGradient}
            >
              <Text style={styles.doneBtnText}>Return to Settings</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Send Feedback" onBack={handleBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="chatbubbles" size={24} color="#ffffff" />
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>WE LISTEN TO SINGLES</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Help Shape Soulmate</Text>
              <Text style={styles.heroSubtitle}>
                Your ideas, bug reports, and suggestions directly guide what we build next for singles across our community.
              </Text>

              {/* Trust Pills */}
              <View style={styles.trustPillRow}>
                <View style={styles.trustPill}>
                  <Ionicons name="mail-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>100% Read</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="rocket-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Continuous Updates</Text>
                </View>
                <View style={styles.trustPill}>
                  <Ionicons name="lock-closed-outline" size={13} color="#ffffff" />
                  <Text style={styles.trustPillText}>Confidential</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Category Picker */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Feedback Category
            </Text>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
              Select the area that best describes your thoughts
            </Text>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      {
                        backgroundColor: isSelected
                          ? `${cat.color}12`
                          : colors.surface,
                        borderColor: isSelected ? cat.color : colors.border,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handleSelectCategory(cat.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        { backgroundColor: `${cat.color}20` },
                      ]}
                    >
                      <Ionicons name={cat.icon} size={20} color={cat.color} />
                    </View>

                    <View style={styles.categoryContent}>
                      <View style={styles.categoryTitleRow}>
                        <Text style={[styles.categoryTitle, { color: colors.text }]}>
                          {cat.title}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={cat.color}
                          />
                        )}
                      </View>
                      <Text
                        style={[styles.categoryDesc, { color: colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {cat.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Rating Section */}
          <View
            style={[
              styles.ratingCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.ratingTitle, { color: colors.text }]}>
              How has your Soulmate experience been?
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => handleStarPress(star)}
                  style={styles.starTouchTarget}
                  hitSlop={6}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={star <= rating ? "#f59e0b" : colors.border}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
              {rating > 0 ? RATING_LABELS[rating] : "Tap a star to rate"}
            </Text>
          </View>

          {/* Quick Topic Chips */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Quick Topics (Tap to Add)
            </Text>
            <View style={styles.chipsRow}>
              {QUICK_TOPICS.map((topic) => (
                <Pressable
                  key={topic}
                  style={({ pressed }) => [
                    styles.topicChip,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleTopicPress(topic)}
                >
                  <Ionicons name="add" size={13} color={colors.accent} />
                  <Text style={[styles.topicChipText, { color: colors.text }]}>
                    {topic}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Feedback Text Input Card */}
          <View
            style={[
              styles.inputCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {selectedCategory === "bug"
                ? "Describe the Bug in Detail"
                : "Your Feedback & Suggestions"}
            </Text>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: feedback ? colors.accent : colors.border,
                },
              ]}
            >
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                value={feedback}
                onChangeText={setFeedback}
                placeholder={
                  selectedCategory === "bug"
                    ? "Explain what happened, what device you're using, and steps to reproduce..."
                    : selectedCategory === "suggestion"
                    ? "I wish Soulmate had a feature where..."
                    : selectedCategory === "compliment"
                    ? "What I love most about Soulmate is..."
                    : "Share your thoughts, questions, or ideas..."
                }
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                maxLength={maxCharacters}
              />
            </View>

            <View style={styles.inputFooterRow}>
              <Text style={[styles.minCharNotice, { color: colors.textTertiary }]}>
                Min. 10 characters
              </Text>
              <Text
                style={[
                  styles.charCount,
                  {
                    color:
                      characterCount > maxCharacters * 0.9
                        ? colors.accent
                        : colors.textTertiary,
                  },
                ]}
              >
                {characterCount}/{maxCharacters}
              </Text>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (!feedback.trim() || feedback.trim().length < 10 || isSubmitting) && {
                  opacity: 0.5,
                },
                pressed && !isSubmitting && { transform: [{ scale: 0.99 }] },
              ]}
              onPress={handleSubmit}
              disabled={!feedback.trim() || feedback.trim().length < 10 || isSubmitting}
            >
              <LinearGradient
                colors={["#e63946", "#ff6b78"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.submitBtnText}>Submitting Feedback...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Submit Feedback</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Privacy Note */}
          <View style={styles.footerNoteWrap}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>
              Feedback is reviewed confidentially by our core product team. We never publish feedback publicly or share it with other daters.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#e63946",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 19,
    marginBottom: 14,
  },
  trustPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  trustPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 16,
  },
  categoryGrid: {
    gap: 10,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryContent: {
    flex: 1,
    gap: 2,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryTitle: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  categoryDesc: {
    fontSize: 12,
  },
  ratingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  ratingTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  starTouchTarget: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 11,
    gap: 4,
  },
  topicChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    minHeight: 120,
  },
  textArea: {
    fontSize: 14.5,
    lineHeight: 20,
    minHeight: 100,
  },
  inputFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  minCharNotice: {
    fontSize: 11.5,
  },
  charCount: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  footerNoteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 22,
    gap: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* Success Screen Styles */
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(230, 57, 70, 0.15)",
    padding: 6,
    marginBottom: 16,
  },
  successGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  successPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  successPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  successDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 28,
    maxWidth: 320,
  },
  doneBtn: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  doneGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});