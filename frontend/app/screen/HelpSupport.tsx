import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
      color: "#FF6B6B"
    },
    {
      id: "2",
      title: "Send Feedback",
      description: "Share your experience with us",
      icon: "megaphone",
      action:()=> router.push('/screen/FeedbackScreen'),
      color: "#4CAF50"
    },
    {
      id: "3",
      title: "Community Guidelines",
      description: "Read our community rules",
      icon: "people",
      action: () => router.push('/screen/CommunityGuidelines'),
      color: "#2196F3"
    },
    {
      id: "4",
      title: "Privacy Policy",
      description: "Learn about data protection",
      icon: "shield-checkmark",
      action: () => router.push('/screen/PrivacyPolicy'),
      color: "#9C27B0"
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
      style={styles.faqItem}
      onPress={() => toggleFAQ(faq.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <Ionicons 
          name={faq.isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </View>
      {faq.isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
        </View>
      )}
    </Pressable>
  );

  const SupportOptionCard = ({ option }: { option: SupportOption }) => (
    <Pressable style={styles.supportOption} onPress={option.action}>
      <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
        <Ionicons name={option.icon as any} size={24} color={option.color} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="help-buoy" size={32} color="#FF6B6B" />
          </View>
          <Text style={styles.welcomeTitle}>How can we help you?</Text>
          <Text style={styles.welcomeDescription}>
            We&apos;re here to help! Choose an option below or browse our FAQs.
          </Text>
        </View>

        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.supportOptionsGrid}>
            {supportOptions.map((option) => (
              <SupportOptionCard key={option.id} option={option} />
            ))}
          </View>
        </View>

        {/* Quick Solutions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Solutions</Text>
          <Text style={styles.sectionDescription}>
            Common issues and their solutions
          </Text>
          
          <View style={styles.quickSolutionsGrid}>
            {quickSolutions.map((solution, index) => (
              <View key={index} style={styles.solutionCard}>
                <Text style={styles.solutionTitle}>{solution.title}</Text>
                <View style={styles.issuesList}>
                  {solution.issues.map((issue, issueIndex) => (
                    <View key={issueIndex} style={styles.issueItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionDescription}>
            Quick answers to common questions
          </Text>
          
          <View style={styles.faqList}>
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Ionicons name="headset" size={24} color="#FF6B6B" />
          <View style={styles.contactText}>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactDescription}>
              Our support team is available 24/7 to assist you
            </Text>
          </View>
          <Pressable style={styles.contactButton} onPress={contactSupport}>
            <Text style={styles.contactButtonText}>Contact Now</Text>
          </Pressable>
        </View>

        {/* App Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Average response time: 2 hours</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
            <Text style={styles.infoText}>98% customer satisfaction</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="globe-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Support available in 12 languages</Text>
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
  welcomeSection: {
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop:16,
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
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFE5E5",
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
  supportOptionsGrid: {
    gap: 12,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
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
    color: "#1a1a1a",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: "#666",
  },
  quickSolutionsGrid: {
    gap: 12,
  },
  solutionCard: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
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
    color: "#666",
    flex: 1,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: "#f8f9fa",
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
    color: "#1a1a1a",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  faqAnswerText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  contactSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFE5E5",
    gap: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
  },
  contactButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FF6B6B",
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  infoSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
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
    color: "#666",
    fontWeight: "500",
  },
});