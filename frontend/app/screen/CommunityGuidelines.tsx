import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Guideline {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'positive' | 'negative';
}

export default function CommunityGuidelines() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const guidelines: Guideline[] = [
    {
      id: "1",
      title: "Be Respectful",
      description: "Treat all members with kindness and respect. Harassment, hate speech, and discrimination of any kind will not be tolerated.",
      icon: "heart",
      type: 'positive'
    },
    {
      id: "2",
      title: "No Harassment",
      description: "Do not send unsolicited explicit content or make unwanted advances. Respect boundaries and take 'no' for an answer.",
      icon: "close-circle",
      type: 'negative'
    },
    {
      id: "3",
      title: "Authentic Profiles",
      description: "Use recent photos of yourself and provide accurate information. Fake profiles or impersonation will result in permanent bans.",
      icon: "person",
      type: 'positive'
    },
    {
      id: "4",
      title: "No Spam or Solicitation",
      description: "Do not use the platform for commercial purposes, spam, or to promote external services without permission.",
      icon: "megaphone",
      type: 'negative'
    },
    {
      id: "5",
      title: "Protect Privacy",
      description: "Do not share personal contact information too quickly. Report anyone who pressures you for personal details.",
      icon: "shield-checkmark",
      type: 'positive'
    },
    {
      id: "6",
      title: "Age Requirement",
      description: "You must be 18 years or older to use this platform. Misrepresenting your age will result in account termination.",
      icon: "calendar",
      type: 'negative'
    },
    {
      id: "7",
      title: "Report Concerns",
      description: "If you see something that violates our guidelines, please report it immediately. We review all reports promptly.",
      icon: "flag",
      type: 'positive'
    },
    {
      id: "8",
      title: "Be Yourself",
      description: "Authenticity creates better connections. Be genuine in your interactions and profile information.",
      icon: "star",
      type: 'positive'
    }
  ];

  const GuidelineItem = ({ guideline }: { guideline: Guideline }) => (
    <View style={[
      styles.guidelineItem,
      guideline.type === 'negative' && styles.negativeGuideline
    ]}>
      <View style={styles.guidelineHeader}>
        <View style={[
          styles.guidelineIcon,
          guideline.type === 'negative' ? styles.negativeIcon : styles.positiveIcon
        ]}>
          <Ionicons 
            name={guideline.icon as any} 
            size={20} 
            color={guideline.type === 'negative' ? "#fff" : "#fff"} 
          />
        </View>
        <Text style={styles.guidelineTitle}>{guideline.title}</Text>
      </View>
      <Text style={styles.guidelineDescription}>{guideline.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIcon}>
            <Ionicons name="people" size={32} color="#FF6B6B" />
          </View>
          <Text style={styles.introTitle}>Welcome to Our Community</Text>
          <Text style={styles.introDescription}>
            Our guidelines help create a safe, respectful, and enjoyable environment for everyone. By using our platform, you agree to follow these rules.
          </Text>
        </View>

        {/* Guidelines List */}
        <View style={styles.guidelinesSection}>
          <Text style={styles.sectionTitle}>Community Rules</Text>
          <Text style={styles.sectionDescription}>
            These guidelines ensure everyone has a positive experience
          </Text>
          
          <View style={styles.guidelinesList}>
            {guidelines.map((guideline) => (
              <GuidelineItem key={guideline.id} guideline={guideline} />
            ))}
          </View>
        </View>

        {/* Consequences Section */}
        <View style={styles.consequencesSection}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.consequencesText}>
            <Text style={styles.consequencesTitle}>Violation Consequences</Text>
            <Text style={styles.consequencesDescription}>
              Violating these guidelines may result in content removal, temporary suspension, or permanent account termination depending on severity.
            </Text>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.safetySection}>
          <Text style={styles.safetyTitle}>Safety Tips</Text>
          <View style={styles.safetyTips}>
            <View style={styles.safetyTip}>
              <Ionicons name="videocam" size={16} color="#4CAF50" />
              <Text style={styles.safetyTipText}>Video chat before meeting</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.safetyTipText}>Meet in public places</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="car" size={16} color="#4CAF50" />
              <Text style={styles.safetyTipText}>Arrange your own transportation</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="alert" size={16} color="#4CAF50" />
              <Text style={styles.safetyTipText}>Trust your instincts</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencySection}>
          <Ionicons name="medkit" size={20} color="#FF6B6B" />
          <View style={styles.emergencyText}>
            <Text style={styles.emergencyTitle}>Emergency Situations</Text>
            <Text style={styles.emergencyDescription}>
              If you feel unsafe or are in immediate danger, contact local emergency services first.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
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
  introSection: {
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFE5E5",
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  introDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  guidelinesSection: {
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
  guidelinesList: {
    gap: 16,
  },
  guidelineItem: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  negativeGuideline: {
    borderLeftColor: "#FF6B6B",
  },
  guidelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  guidelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  positiveIcon: {
    backgroundColor: "#4CAF50",
  },
  negativeIcon: {
    backgroundColor: "#FF6B6B",
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  guidelineDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginLeft: 48,
  },
  consequencesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0B2",
    gap: 12,
  },
  consequencesText: {
    flex: 1,
  },
  consequencesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  consequencesDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
  },
  safetySection: {
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
  safetyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  safetyTips: {
    gap: 8,
  },
  safetyTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  safetyTipText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  emergencySection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFEBEE",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 12,
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
  },
});