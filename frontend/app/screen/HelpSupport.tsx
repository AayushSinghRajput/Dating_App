import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  isExpanded: boolean;
}

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
}

export default function HelpSupport() {
  const router = useRouter();
  const { colors } = useTheme();
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: "1",
      question: "How do I reset my password?",
      answer: "Go to Settings > Account > Change Password. You'll receive an email with a link to reset your password. Make sure to check your spam folder if you don't see it.",
      isExpanded: false
    },
    {
      id: "2",
      question: "Why can't I see my matches?",
      answer: "If you're not seeing matches, check your internet connection and make sure your profile is complete. Also ensure your discovery settings are configured correctly in the Settings menu.",
      isExpanded: false
    },
    {
      id: "3",
      question: "How do I report a user?",
      answer: "Go to the user's profile, tap the three dots in the top right corner, and select 'Report'. You can choose the reason and provide additional details. Our team will review it within 24 hours.",
      isExpanded: false
    },
    {
      id: "4",
      question: "Can I change my location?",
      answer: "Yes! Go to Settings > Discovery Preferences > Location. You can set your location manually or enable location services for automatic updates.",
      isExpanded: false
    },
    {
      id: "5",
      question: "How does the matching algorithm work?",
      answer: "Our algorithm considers your preferences, interests, location, and behavior patterns to suggest compatible matches. The more you use the app, the better our suggestions become!",
      isExpanded: false
    }
  ]);

  const handleBack = () => {
    router.back();
  };

  const toggleFAQ = (id: string) => {
    setFaqs(faqs.map(faq =>
      faq.id === id
        ? { ...faq, isExpanded: !faq.isExpanded }
        : { ...faq, isExpanded: false }
    ));
  };

  const contactSupport = () => {
    Alert.alert(
      "Contact Support",
      "How would you like to contact us?",
      [
        { text: "Email", onPress: () => Linking.openURL('mailto:support@datingapp.com') },
        { text: "Live Chat", onPress: () => Alert.alert("Live Chat", "Connecting you with our support team...") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };


  const supportOptions: SupportOption[] = [
    {
      id: "1",
      title: "Contact Support",
      description: "Get help from our support team",
      icon: "chatbubble-ellipses",
      action: contactSupport,
      color: colors.accent
    },
    {
      id: "2",
      title: "Send Feedback",
      description: "Share your experience with us",
      icon: "megaphone",
      action:()=> router.push('/screen/FeedbackScreen'),
      color: colors.success
    },
    {
      id: "3",
      title: "Community Guidelines",
      description: "Read our community rules",
      icon: "people",
      action: () => router.push('/screen/CommunityGuidelines'),
      color: "#2196F3"
    }
  ];

  const quickSolutions = [
    {
      title: "Account Issues",
      issues: ["Can't login", "Password reset", "Account deletion"]
    },
    {
      title: "Matching Problems",
      issues: ["No matches", "Profile not showing", "Location issues"]
    },
    {
      title: "Payment & Subscriptions",
      issues: ["Billing questions", "Subscription management", "Refund requests"]
    }
  ];

  const FAQItem = ({ faq }: { faq: FAQItem }) => (
    <Pressable
      style={[styles.faqItem, { backgroundColor: colors.surfaceAlt }]}
      onPress={() => toggleFAQ(faq.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
        <Ionicons
          name={faq.isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </View>
      {faq.isExpanded && (
        <View style={[styles.faqAnswer, { borderTopColor: colors.border }]}>
          <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>{faq.answer}</Text>
        </View>
      )}
    </Pressable>
  );

  const SupportOptionCard = ({ option }: { option: SupportOption }) => (
    <Pressable style={[styles.supportOption, { backgroundColor: colors.surfaceAlt }]} onPress={option.action}>
      <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
        <Ionicons name={option.icon as any} size={24} color={option.color} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
        <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{option.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Help & Support" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.welcomeIcon, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <Ionicons name="help-buoy" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>How can we help you?</Text>
          <Text style={[styles.welcomeDescription, { color: colors.textSecondary }]}>
            We&apos;re here to help! Choose an option below or browse our FAQs.
          </Text>
        </View>

        {/* Support Options */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Get Help</Text>
          <View style={styles.supportOptionsGrid}>
            {supportOptions.map((option) => (
              <SupportOptionCard key={option.id} option={option} />
            ))}
          </View>
        </View>

        {/* Quick Solutions */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Solutions</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Common issues and their solutions
          </Text>

          <View style={styles.quickSolutionsGrid}>
            {quickSolutions.map((solution, index) => (
              <View key={index} style={[styles.solutionCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.solutionTitle, { color: colors.text }]}>{solution.title}</Text>
                <View style={styles.issuesList}>
                  {solution.issues.map((issue, issueIndex) => (
                    <View key={issueIndex} style={styles.issueItem}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                      <Text style={[styles.issueText, { color: colors.textSecondary }]}>{issue}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Quick answers to common questions
          </Text>

          <View style={styles.faqList}>
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={[styles.contactSection, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
          <Ionicons name="headset" size={24} color={colors.accent} />
          <View style={styles.contactText}>
            <Text style={[styles.contactTitle, { color: colors.text }]}>Still need help?</Text>
            <Text style={[styles.contactDescription, { color: colors.textSecondary }]}>
              Our support team is available 24/7 to assist you
            </Text>
          </View>
          <Pressable style={[styles.contactButton, { backgroundColor: colors.accent }]} onPress={contactSupport}>
            <Text style={styles.contactButtonText}>Contact Now</Text>
          </Pressable>
        </View>

        {/* App Information */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Average response time: 2 hours</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>98% customer satisfaction</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Support available in 12 languages</Text>
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
  welcomeSection: {
    alignItems: "center",
    marginHorizontal: 16,
    marginTop:16,
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
    borderWidth: 2,
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
  supportOptionsGrid: {
    gap: 12,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  quickSolutionsGrid: {
    gap: 12,
  },
  solutionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  issuesList: {
    gap: 8,
  },
  issueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  issueText: {
    fontSize: 13,
    flex: 1,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    borderRadius: 12,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  infoSection: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
