import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

interface PolicySection {
  id: string;
  title: string;
  content: string;
  icon: string;
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    router.back();
  };

  const policySections: PolicySection[] = [
    {
      id: "1",
      title: "Information We Collect",
      content: "We collect information you provide directly to us, including your name, email address, profile information, photos, and messages. We also automatically collect certain information about your device and how you use our services.",
      icon: "information-circle"
    },
    {
      id: "2",
      title: "How We Use Your Information",
      content: "We use your information to provide and improve our services, personalize your experience, communicate with you, show you relevant matches, and ensure the safety and security of our community.",
      icon: "settings"
    },
    {
      id: "3",
      title: "Information Sharing",
      content: "We do not sell your personal information. We may share information with service providers, when required by law, or to protect our rights. Your profile information is visible to other users as part of our service.",
      icon: "share-social"
    },
    {
      id: "4",
      title: "Data Security",
      content: "We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
      icon: "shield-checkmark"
    },
    {
      id: "5",
      title: "Your Rights",
      content: "You can access, update, or delete your personal information through your account settings. You may also have rights to restrict or object to certain processing activities under applicable laws.",
      icon: "person"
    },
    {
      id: "6",
      title: "Cookies & Tracking",
      content: "We use cookies and similar technologies to analyze trends, administer the website, track users' movements around the site, and to gather demographic information about our user base.",
      icon: "analytics"
    },
    {
      id: "7",
      title: "International Transfers",
      content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during these transfers.",
      icon: "globe"
    },
    {
      id: "8",
      title: "Children's Privacy",
      content: "Our services are not intended for users under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will take steps to delete it.",
      icon: "heart"
    }
  ];

  const PolicySectionItem = ({ section }: { section: PolicySection }) => (
    <View style={styles.sectionItem}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name={section.icon as any} size={20} color={colors.accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
      </View>
      <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{section.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View style={[styles.introSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.introIcon, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.introTitle, { color: colors.text }]}>Your Privacy Matters</Text>
          <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
            Last updated: December 2023{"\n"}
            We are committed to protecting your personal information and being transparent about what we collect and how we use it.
          </Text>
        </View>

        {/* Policy Sections */}
        <View style={[styles.policySections, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          {policySections.map((section) => (
            <PolicySectionItem key={section.id} section={section} />
          ))}
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>Contact Us</Text>
          <Text style={[styles.contactDescription, { color: colors.textSecondary }]}>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </Text>
          <View style={styles.contactInfo}>
            <Ionicons name="mail" size={16} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>privacy@datingapp.com</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Pressable style={[styles.actionButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="download" size={20} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Download Policy</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="print" size={20} color={colors.textSecondary} />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>Print Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  },
  headerPlaceholder: {
    width: 40,
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
  policySections: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionItem: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 48,
  },
  contactSection: {
    backgroundColor: "#F0F9FF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8F4FF",
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsSection: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});