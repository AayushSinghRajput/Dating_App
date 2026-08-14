import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

interface Guideline {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'positive' | 'negative';
}

export default function CommunityGuidelines() {
  const router = useRouter();
  const { colors } = useTheme();

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
      { backgroundColor: colors.surfaceAlt, borderLeftColor: colors.success },
      guideline.type === 'negative' && { borderLeftColor: colors.accent }
    ]}>
      <View style={styles.guidelineHeader}>
        <View style={[
          styles.guidelineIcon,
          { backgroundColor: guideline.type === 'negative' ? colors.accent : colors.success }
        ]}>
          <Ionicons
            name={guideline.icon as any}
            size={20}
            color="#fff"
          />
        </View>
        <Text style={[styles.guidelineTitle, { color: colors.text }]}>{guideline.title}</Text>
      </View>
      <Text style={[styles.guidelineDescription, { color: colors.textSecondary }]}>{guideline.description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Community Guidelines" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <Ionicons name="people" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>Welcome to Our Community</Text>
          <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
            Our guidelines help create a safe, respectful, and enjoyable environment for everyone. By using our platform, you agree to follow these rules.
          </Text>
        </View>

        {/* Guidelines List */}
        <View style={[styles.guidelinesSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Community Rules</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            These guidelines ensure everyone has a positive experience
          </Text>

          <View style={styles.guidelinesList}>
            {guidelines.map((guideline) => (
              <GuidelineItem key={guideline.id} guideline={guideline} />
            ))}
          </View>
        </View>

        {/* Consequences Section */}
        <View style={[styles.consequencesSection, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.consequencesText}>
            <Text style={[styles.consequencesTitle, { color: colors.text }]}>Violation Consequences</Text>
            <Text style={[styles.consequencesDescription, { color: colors.textSecondary }]}>
              Violating these guidelines may result in content removal, temporary suspension, or permanent account termination depending on severity.
            </Text>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={[styles.safetySection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.safetyTitle, { color: colors.text }]}>Safety Tips</Text>
          <View style={styles.safetyTips}>
            <View style={styles.safetyTip}>
              <Ionicons name="videocam" size={16} color={colors.success} />
              <Text style={[styles.safetyTipText, { color: colors.textSecondary }]}>Video chat before meeting</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="location" size={16} color={colors.success} />
              <Text style={[styles.safetyTipText, { color: colors.textSecondary }]}>Meet in public places</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="car" size={16} color={colors.success} />
              <Text style={[styles.safetyTipText, { color: colors.textSecondary }]}>Arrange your own transportation</Text>
            </View>
            <View style={styles.safetyTip}>
              <Ionicons name="alert" size={16} color={colors.success} />
              <Text style={[styles.safetyTipText, { color: colors.textSecondary }]}>Trust your instincts</Text>
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={[styles.emergencySection, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
          <Ionicons name="medkit" size={20} color={colors.accent} />
          <View style={styles.emergencyText}>
            <Text style={[styles.emergencyTitle, { color: colors.text }]}>Emergency Situations</Text>
            <Text style={[styles.emergencyDescription, { color: colors.textSecondary }]}>
              If you feel unsafe or are in immediate danger, contact local emergency services first.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    paddingBottom: 30,
  },
  introSection: {
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 24,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  introDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  guidelinesSection: {
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
  guidelinesList: {
    gap: 16,
  },
  guidelineItem: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
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
  guidelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  guidelineDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 48,
  },
  consequencesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  consequencesText: {
    flex: 1,
  },
  consequencesTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  consequencesDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
  safetySection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: "700",
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
    flex: 1,
  },
  emergencySection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  emergencyText: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
});
