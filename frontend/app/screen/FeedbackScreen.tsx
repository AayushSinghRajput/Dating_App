import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

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
      color: '#FF6B6B'
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
        selectedCategory === category.id && styles.categoryCardSelected
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: `${category.color}15` }]}>
        <Ionicons 
          name={category.icon as any} 
          size={24} 
          color={selectedCategory === category.id ? category.color : '#999'} 
        />
      </View>
      <View style={styles.categoryText}>
        <Text style={[
          styles.categoryTitle,
          selectedCategory === category.id && { color: category.color }
        ]}>
          {category.title}
        </Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </View>
      {selectedCategory === category.id && (
        <Ionicons name="checkmark-circle" size={20} color={category.color} />
      )}
    </Pressable>
  );

  const StarRating = () => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingTitle}>How would you rate your experience?</Text>
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
              color={star <= rating ? "#FFD700" : "#ccc"}
            />
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingText}>
        {rating === 0 ? 'Select a rating' : `${rating} star${rating > 1 ? 's' : ''}`}
      </Text>
    </View>
  );

  const characterCount = feedback.length;
  const maxCharacters = 1000;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={styles.headerPlaceholder} />
      </View>

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
          <View style={styles.welcomeSection}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.welcomeIcon}
            >
              <Ionicons name="megaphone" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Share Your Thoughts</Text>
            <Text style={styles.welcomeDescription}>
              We&apos;re constantly working to improve your experience. Your feedback helps us make the app better for everyone.
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.sectionDescription}>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Your {selectedCategory === 'bug' ? 'Bug Report' : 'Feedback'}
            </Text>
            <Text style={styles.sectionDescription}>
              {selectedCategory === 'bug' 
                ? 'Please describe the issue in detail, including steps to reproduce it.'
                : 'Be specific about what you like, dislike, or would like to see improved.'
              }
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={feedback}
                onChangeText={setFeedback}
                placeholder={
                  selectedCategory === 'bug' 
                    ? "Describe the bug you encountered..."
                    : "Tell us what's on your mind..."
                }
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                maxLength={maxCharacters}
              />
              <View style={styles.characterCount}>
                <Text style={[
                  styles.characterCountText,
                  characterCount > maxCharacters * 0.9 && { color: '#FF6B6B' }
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
                <Text style={styles.screenshotText}>
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
              <Text style={styles.tipsDescription}>
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
            <Text style={styles.privacyText}>
              Your feedback is anonymous unless you choose to include contact information. 
              We may reach out for more details if needed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  headerPlaceholder: {
    width: 40,
  },
  welcomeSection: {
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
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
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
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
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 12,
  },
  categoryCardSelected: {
    backgroundColor: "#fff",
    borderColor: "#f0f0f0",
    shadowColor: "#000",
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
    color: "#1a1a1a",
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#666",
  },
  ratingSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
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
    color: "#666",
    fontWeight: "500",
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    borderRadius: 12,
    padding: 16,
    paddingBottom: 40,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#f8f9fa",
    textAlignVertical: 'top',
  },
  characterCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  characterCountText: {
    fontSize: 12,
    color: "#999",
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
    color: "#1a1a1a",
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
    color: "#666",
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
    color: "#999",
    textAlign: "center",
    lineHeight: 16,
  },
});