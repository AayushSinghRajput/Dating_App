import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

type FeedbackCategory = 'bug' | 'suggestion' | 'compliment' | 'general';

interface FeedbackCategoryOption {
  id: FeedbackCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory>('general');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const feedbackCategories: FeedbackCategoryOption[] = [
    {
      id: 'bug',
      title: 'Bug Report',
      description: 'Something is not working',
      icon: 'bug',
      color: colors.accent
    },
    {
      id: 'suggestion',
      title: 'Suggestion',
      description: 'Share your ideas',
      icon: 'bulb',
      color: '#4ECDC4'
    },
    {
      id: 'compliment',
      title: 'Compliment',
      description: 'What you love about us',
      icon: 'heart',
      color: '#FF9E7D'
    },
    {
      id: 'general',
      title: 'General',
      description: 'Other feedback',
      icon: 'chatbox',
      color: '#45B7D1'
    }
  ];

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert('Error', 'Please provide more detailed feedback (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFeedback('');
              setRating(0);
              setSelectedCategory('general');
              setIncludeScreenshot(false);
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CategoryCard = ({ category }: { category: FeedbackCategoryOption }) => (
    <Pressable
      style={[
        styles.categoryCard,
        { backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
        selectedCategory === category.id && [styles.categoryCardSelected, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
        <Ionicons
          name={category.icon as any}
          size={24}
          color={selectedCategory === category.id ? category.color : colors.textTertiary}
        />
      </View>
      <View style={styles.categoryText}>
        <Text style={[
          styles.categoryTitle,
          { color: colors.text },
          selectedCategory === category.id && { color: category.color }
        ]}>
          {category.title}
        </Text>
        <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>{category.description}</Text>
      </View>
      {selectedCategory === category.id && (
        <Ionicons name="checkmark-circle" size={20} color={category.color} />
      )}
    </Pressable>
  );

  const StarRating = () => (
    <View style={[styles.ratingSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <Text style={[styles.ratingTitle, { color: colors.text }]}>How would you rate your experience?</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#FFD700" : colors.textTertiary}
            />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
        {rating === 0 ? 'Select a rating' : `${rating} star${rating > 1 ? 's' : ''}`}
      </Text>
    </View>
  );

  const characterCount = feedback.length;
  const maxCharacters = 1000;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Send Feedback" onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={[styles.welcomeSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.welcomeIcon}
            >
              <Ionicons name="megaphone" size={32} color="#fff" />
            </LinearGradient>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Share Your Thoughts</Text>
            <Text style={[styles.welcomeDescription, { color: colors.textSecondary }]}>
              We&apos;re constantly working to improve your experience. Your feedback helps us make the app better for everyone.
            </Text>
          </View>

          {/* Category Selection */}
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              What type of feedback would you like to share?
            </Text>
            
            <View style={styles.categoriesGrid}>
              {feedbackCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </View>
          </View>

          {/* Rating Section */}
          {selectedCategory !== 'bug' && <StarRating />}

          {/* Feedback Input */}
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your {selectedCategory === 'bug' ? 'Bug Report' : 'Feedback'}
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              {selectedCategory === 'bug'
                ? 'Please describe the issue in detail, including steps to reproduce it.'
                : 'Be specific about what you like, dislike, or would like to see improved.'
              }
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt }]}
                value={feedback}
                onChangeText={setFeedback}
                placeholder={
                  selectedCategory === 'bug'
                    ? "Describe the bug you encountered..."
                    : "Tell us what's on your mind..."
                }
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                maxLength={maxCharacters}
              />
              <View style={styles.characterCount}>
                <Text style={[
                  styles.characterCountText,
                  { color: colors.textTertiary },
                  characterCount > maxCharacters * 0.9 && { color: colors.accent }
                ]}>
                  {characterCount}/{maxCharacters}
                </Text>
              </View>
            </View>

            {/* Screenshot Option */}
            {selectedCategory === 'bug' && (
              <Pressable 
                style={styles.screenshotOption}
                onPress={() => setIncludeScreenshot(!includeScreenshot)}
              >
                <View style={styles.checkbox}>
                  {includeScreenshot && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={[styles.screenshotText, { color: colors.text }]}>
                  Include screenshot (recommended for bugs)
                </Text>
              </Pressable>
            )}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Ionicons name="information-circle" size={20} color="#667eea" />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Feedback Tips</Text>
              <Text style={[styles.tipsDescription, { color: colors.textSecondary }]}>
                • Be specific and descriptive{'\n'}
                • Include steps to reproduce for bugs{'\n'}
                • Suggest solutions if you have any{'\n'}
                • We read every piece of feedback
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable 
            style={[
              styles.submitButton,
              (!feedback.trim() || isSubmitting) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.submitButtonGradient}
            >
              {isSubmitting ? (
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Privacy Notice */}
          <View style={styles.privacySection}>
            <Text style={[styles.privacyText, { color: colors.textTertiary }]}>
              Your feedback is anonymous unless you choose to include contact information. 
              We may reach out for more details if needed.
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  welcomeSection: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
    lineHeight: 18,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  categoryCardSelected: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
  },
  ratingSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  characterCountText: {
    fontSize: 12,
    fontWeight: "500",
  },
  screenshotOption: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#667eea",
    backgroundColor: "#667eea",
    justifyContent: "center",
    alignItems: "center",
  },
  screenshotText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tipsSection: {
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#667eea",
    gap: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 4,
  },
  tipsDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  submitButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#667eea",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  privacySection: {
    marginHorizontal: 16,
    padding: 16,
  },
  privacyText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
});