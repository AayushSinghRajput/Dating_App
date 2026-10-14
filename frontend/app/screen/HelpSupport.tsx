import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";
import { radius } from "@/src/theme/radius";

type FAQCategory = "all" | "safety" | "matching" | "profile" | "account";

interface FAQItem {
  id: string;
  category: "safety" | "matching" | "profile" | "account";
  categoryLabel: string;
  question: string;
  answer: string;
  tips?: string[];
}

interface SafetyTopic {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  action: () => void;
  accentColor: string;
}

const SUPPORT_EMAIL = "soulmatelumi@gmail.com";

// Dating app FAQ dataset inspired by Tinder, Bumble, & Hinge support centers
const FAQS: FAQItem[] = [
  {
    id: "1",
    category: "safety",
    categoryLabel: "Safety & Trust",
    question: "How do I report someone or flag inappropriate behavior?",
    answer:
      "Your safety is our #1 commitment. Tap the three dots (···) on any user profile or inside your chat and select 'Report'. You can choose reasons such as harassment, fake photos, impersonation, or offline safety concerns. All reports are 100% anonymous.",
    tips: [
      "The reported user will never know who reported them.",
      "Reporting automatically unmatches and blocks the user instantly.",
      "Our Trust & Safety moderators review flagged accounts within 24 hours.",
    ],
  },
  {
    id: "2",
    category: "profile",
    categoryLabel: "Profile & Photos",
    question: "What is Photo Verification and how do I get the blue tick?",
    answer:
      "Photo Verification proves you're genuinely the person in your photos. Navigate to Settings > Photo Verification. You will take a quick video selfie matching a random pose. Our biometric AI verifies your face and awards you the verified blue badge.",
    tips: [
      "Verified profiles receive up to 3x more matches and likes.",
      "Your video selfie is encrypted and never displayed publicly.",
    ],
  },
  {
    id: "3",
    category: "matching",
    categoryLabel: "Matching & Chat",
    question: "Why am I not seeing matches or receiving likes?",
    answer:
      "Dating app visibility is driven by profile quality and active discovery settings. If your feed is quiet, expanding your distance radius or age range can immediately open up new pools of daters.",
    tips: [
      "Upload at least 3-4 diverse photos showing smiles, full body, and hobbies.",
      "Fill out Hinge-style prompts and lifestyle badges to give people easy conversation starters.",
      "Check Settings > Discovery Preferences to verify your distance and age filters.",
    ],
  },
  {
    id: "4",
    category: "matching",
    categoryLabel: "Matching & Chat",
    question: "Can someone tell if I unmatched or blocked them?",
    answer:
      "No. When you unmatch or block someone, the conversation and profile disappear completely from both of your apps. We never send a notification, making it quiet, clean, and safe.",
    tips: [
      "Unmatching is permanent and cannot be undone.",
      "If you blocked someone accidentally, you can unblock them in Settings > Blocked Users.",
    ],
  },
  {
    id: "5",
    category: "safety",
    categoryLabel: "Safety & Trust",
    question: "What are the golden rules for meeting a match in real life?",
    answer:
      "First dates should always be fun, exciting, and above all, safe. Always follow these essential dating safety principles:",
    tips: [
      "Always meet in a crowded public venue (coffee shop, restaurant, or popular lounge).",
      "Control your own transportation — never let a new match pick you up from home.",
      "Tell a trusted friend where you are going and share your live location via Soulmate Safety Center.",
      "Keep your phone charged and stay in control of your drinks and belongings.",
    ],
  },
  {
    id: "6",
    category: "account",
    categoryLabel: "Account & Settings",
    question: "How do I take a break without deleting my account?",
    answer:
      "If you want to step back from dating without losing your chats or matches, you can Snooze your profile. Go to Settings > Discovery Preferences and turn off 'Show Me on Soulmate'. Your profile will be hidden from new people, but you can continue chatting with existing matches.",
  },
  {
    id: "7",
    category: "matching",
    categoryLabel: "Matching & Algorithm",
    question: "How does the Soulmate matching algorithm work?",
    answer:
      "Our compatibility engine pairs users based on a mix of mutual interests, relationship goals, active location proximity, and prompt answers. The more authentically you fill out your profile, the higher your match compatibility scores.",
  },
  {
    id: "8",
    category: "account",
    categoryLabel: "Account & Privacy",
    question: "How do I permanently delete my account and data?",
    answer:
      "To permanently close your account, go to Settings > Delete Account. This immediately wipes your photos, matches, chat logs, and personal data from our servers. Once confirmed, this action cannot be reversed.",
  },
];

const CATEGORIES: { key: FAQCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "all", label: "All Topics", icon: "apps-outline" },
  { key: "safety", label: "Safety & Trust", icon: "shield-outline" },
  { key: "matching", label: "Matches & Chat", icon: "heart-outline" },
  { key: "profile", label: "Profile & Photos", icon: "person-outline" },
  { key: "account", label: "Account & Settings", icon: "settings-outline" },
];

export default function HelpSupport() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>("all");
  const [expandedId, setExpandedId] = useState<string | null>("1");

  // Fast dating app action cards (Bumble & Tinder Quick Hub)
  const quickHubItems = [
    {
      id: "safety-center",
      title: "Safety Center",
      description: "Emergency contacts & live check-in",
      icon: "shield-checkmark" as const,
      color: "#e63946",
      action: () => router.push("/screen/SafetyCenter" as any),
    },
    {
      id: "photo-verify",
      title: "Get Verified",
      description: "Selfie check for the blue badge",
      icon: "checkmark-circle" as const,
      color: "#38bdf8",
      action: () => router.push("/screen/PhotoVerification" as any),
    },
    {
      id: "community-rules",
      title: "Community Rules",
      description: "Our dating standards & etiquette",
      icon: "heart-circle" as const,
      color: "#ec4899",
      action: () => router.push("/screen/CommunityGuidelines" as any),
    },
    {
      id: "send-feedback",
      title: "Send Feedback",
      description: "Help us improve your matches",
      icon: "chatbubble-ellipses" as const,
      color: "#10b981",
      action: () => router.push("/screen/FeedbackScreen" as any),
    },
  ];

  // Curated dating advice topics
  const datingSafetyTopics: SafetyTopic[] = [
    {
      id: "safe-irl",
      title: "First Date Safety Checklist",
      subtitle: "Smart tips before meeting in person",
      icon: "cafe-outline",
      badge: "IRL Guide",
      accentColor: "#f59e0b",
      action: () => {
        Alert.alert(
          "First Date Safety Tips",
          "1. Meet in a bustling public place.\n2. Arrange your own ride to and from the venue.\n3. Share your live date plans with a close friend.\n4. Stay aware and never leave drinks unattended.\n5. If something feels off, leave immediately without hesitation.",
          [{ text: "Got It" }]
        );
      },
    },
    {
      id: "catfish-check",
      title: "Spotting Fake Profiles & Bots",
      subtitle: "Protect yourself from scammers & catfishes",
      icon: "alert-circle-outline",
      badge: "Scam Alert",
      accentColor: "#ef4444",
      action: () => {
        Alert.alert(
          "Catfish & Scam Awareness",
          "• Never send money, crypto, or gift cards to someone you haven't met.\n• Be wary of matches who immediately push to move to WhatsApp or Telegram.\n• Look for the Blue Verified Checkmark on profiles.\n• Insist on a video call before meeting if in doubt.",
          [{ text: "Understood" }]
        );
      },
    },
    {
      id: "consent-respect",
      title: "Dating Etiquette & Consent",
      subtitle: "Zero tolerance for harassment or unwanted media",
      icon: "hand-right-outline",
      badge: "Code of Conduct",
      accentColor: "#8b5cf6",
      action: () => router.push("/screen/CommunityGuidelines" as any),
    },
  ];

  // Filter FAQs based on active category and search term
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery =
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.tips && item.tips.some((tip) => tip.toLowerCase().includes(q)));

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleContactPress = () => {
    Alert.alert(
      "Contact Member Care",
      "How would you like to get in touch with our team?",
      [
        {
          text: "Email Support",
          onPress: () => {
            const subject = encodeURIComponent("Soulmate Dating App Support Request");
            const body = encodeURIComponent(
              "Hello Soulmate Support Team,\n\nI need help with:\n\nMy Account Email/ID:\nDevice:\nDetails of the issue:\n"
            );
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
          },
        },
        {
          text: "Report Safety Incident",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Safety Urgent Assistance",
              "If you are in immediate danger, please dial your local emergency services (e.g. 911 / 100) right away.\n\nFor app-related safety complaints, our priority inbox is monitored 24/7.",
              [
                {
                  text: "Email Safety Team",
                  onPress: () => {
                    const subject = encodeURIComponent("[URGENT SAFETY] Incident Report");
                    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
                  },
                },
                { text: "Dismiss", style: "cancel" },
              ]
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader
        title="Help & Member Care"
        onBack={() => router.back()}
        right={
          <Pressable
            hitSlop={8}
            onPress={handleContactPress}
            accessibilityRole="button"
            accessibilityLabel="Contact support"
            style={styles.headerMailButton}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dating App Hero Banner (Tinder / Bumble Inspired) */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={
              isDark
                ? ["#3b1820", "#1f1519", "#141416"]
                : ["#fff1f2", "#ffe4e6", "#ffffff"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: colors.border }]}
          >
            <View style={styles.heroTopRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="shield-checkmark" size={13} color={colors.accent} />
                <Text style={[styles.heroBadgeText, { color: colors.accent }]}>
                  Trust & Safety
                </Text>
              </View>
              <View
                style={[
                  styles.liveIndicator,
                  {
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(16, 185, 129, 0.12)",
                  },
                ]}
              >
                <View style={styles.liveDot} />
                <Text
                  style={[
                    styles.liveText,
                    { color: isDark ? "#34d399" : "#059669" },
                  ]}
                >
                  24/7 Member Care
                </Text>
              </View>
            </View>

            <Text style={[styles.heroHeading, { color: colors.text }]}>
              How can we help your dating journey?
            </Text>
            <Text style={[styles.heroSubtext, { color: colors.textSecondary }]}>
              Browse answers to popular dating questions, safety guides, or speak directly to a team member.
            </Text>

            {/* Integrated Search Bar */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? colors.surfaceAlt : "#ffffff",
                  borderColor: searchQuery ? colors.accent : colors.border,
                },
              ]}
            >
              <Ionicons
                name="search"
                size={18}
                color={searchQuery ? colors.accent : colors.textTertiary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search topics, safety tips, matching..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Quick Access Action Hub (Bumble / Tinder 2x2 Grid) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Support Tools</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Essential shortcuts
            </Text>
          </View>

          <View style={styles.quickGrid}>
            {quickHubItems.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.quickGridCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={item.action}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.quickCardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.quickCardDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dating Safety & Awareness Cards */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dating Safety & Tips
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Expert advice
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsScrollContent}
          >
            {datingSafetyTopics.map((topic) => (
              <Pressable
                key={topic.id}
                style={[
                  styles.topicCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={topic.action}
              >
                <View style={styles.topicTopRow}>
                  <View
                    style={[
                      styles.topicIconBox,
                      { backgroundColor: `${topic.accentColor}18` },
                    ]}
                  >
                    <Ionicons name={topic.icon} size={20} color={topic.accentColor} />
                  </View>
                  <View
                    style={[
                      styles.topicBadgePill,
                      { backgroundColor: `${topic.accentColor}15` },
                    ]}
                  >
                    <Text style={[styles.topicBadgeText, { color: topic.accentColor }]}>
                      {topic.badge}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.topicTitle, { color: colors.text }]} numberOfLines={1}>
                  {topic.title}
                </Text>
                <Text
                  style={[styles.topicSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {topic.subtitle}
                </Text>

                <View style={styles.topicFooter}>
                  <Text style={[styles.topicReadMore, { color: colors.accent }]}>
                    Learn more
                  </Text>
                  <Ionicons name="arrow-forward" size={13} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Category Pill Filter (Hinge Style) */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked</Text>
            <Text style={[styles.faqCountText, { color: colors.accent }]}>
              {filteredFaqs.length} {filteredFaqs.length === 1 ? "answer" : "answers"}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.surface,
                      borderColor: isSelected ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isSelected ? "#fff" : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color: isSelected ? "#fff" : colors.text,
                        fontWeight: isSelected ? "700" : "500",
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Interactive Accordion FAQs */}
          <View style={styles.faqList}>
            {filteredFaqs.length === 0 ? (
              <View
                style={[
                  styles.emptySearchBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="search-outline" size={32} color={colors.textTertiary} />
                <Text style={[styles.emptySearchTitle, { color: colors.text }]}>
                  No matching answers found
                </Text>
                <Text style={[styles.emptySearchDesc, { color: colors.textSecondary }]}>
                  Try a different keyword or reach out directly to our Member Care team.
                </Text>
                <Pressable
                  style={[styles.emptyResetBtn, { backgroundColor: colors.accentSoft }]}
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  <Text style={[styles.emptyResetText, { color: colors.accent }]}>
                    Reset Search & Filters
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <View
                    key={faq.id}
                    style={[
                      styles.faqCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isExpanded ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Pressable
                      style={styles.faqHeader}
                      onPress={() => toggleAccordion(faq.id)}
                      accessibilityRole="button"
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={styles.faqTagRow}>
                          <View
                            style={[
                              styles.faqCategoryPill,
                              { backgroundColor: colors.surfaceAlt },
                            ]}
                          >
                            <Text
                              style={[
                                styles.faqCategoryText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {faq.categoryLabel}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.faqQuestionText, { color: colors.text }]}>
                          {faq.question}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.faqChevronBox,
                          {
                            backgroundColor: isExpanded
                              ? colors.accentSoft
                              : colors.surfaceAlt,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color={isExpanded ? colors.accent : colors.textSecondary}
                        />
                      </View>
                    </Pressable>

                    {isExpanded && (
                      <View
                        style={[
                          styles.faqExpandedContent,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                          {faq.answer}
                        </Text>

                        {faq.tips && faq.tips.length > 0 && (
                          <View
                            style={[
                              styles.faqTipsContainer,
                              { backgroundColor: colors.surfaceAlt },
                            ]}
                          >
                            <View style={styles.tipsHeaderRow}>
                              <Ionicons
                                name="bulb-outline"
                                size={15}
                                color={colors.accent}
                              />
                              <Text style={[styles.tipsHeaderTitle, { color: colors.text }]}>
                                Helpful Dating Tips
                              </Text>
                            </View>

                            {faq.tips.map((tip, index) => (
                              <View key={`tip-${index}`} style={styles.tipItemRow}>
                                <Ionicons
                                  name="checkmark-circle"
                                  size={14}
                                  color={colors.success}
                                  style={{ marginTop: 2, marginRight: 8 }}
                                />
                                <Text
                                  style={[
                                    styles.tipItemText,
                                    { color: colors.textSecondary },
                                  ]}
                                >
                                  {tip}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* 24/7 Member Care Floating Contact Card */}
        <View style={styles.contactCardContainer}>
          <LinearGradient
            colors={
              isDark
                ? ["#261619", "#1c1417", "#171719"]
                : ["#fff5f6", "#ffffff", "#ffffff"]
            }
            style={[styles.contactCard, { borderColor: colors.border }]}
          >
            <View style={styles.contactCardHeader}>
              <View style={[styles.contactIconCircle, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="headset" size={26} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactCardTitle, { color: colors.text }]}>
                  Still need support?
                </Text>
                <Text style={[styles.contactCardDesc, { color: colors.textSecondary }]}>
                  Our dedicated trust & dating care agents are available around the clock.
                </Text>
              </View>
            </View>

            <View style={styles.contactActionButtons}>
              <Pressable
                style={[styles.primaryContactBtn, { backgroundColor: colors.accent }]}
                onPress={handleContactPress}
              >
                <Ionicons name="mail-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryContactBtnText}>Contact Member Care</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.secondarySafetyBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                onPress={() => router.push("/screen/SafetyCenter" as any)}
              >
                <Ionicons
                  name="shield-outline"
                  size={17}
                  color={colors.accent}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.secondarySafetyBtnText, { color: colors.text }]}>
                  Visit Safety Center
                </Text>
              </Pressable>
            </View>

            {/* Trust Assurance Row */}
            <View style={[styles.trustDivider, { borderTopColor: colors.border }]}>
              <View style={styles.trustItem}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.trustItemText, { color: colors.textSecondary }]}>
                  Avg response: &lt; 2 hrs
                </Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.trustItemText, { color: colors.textSecondary }]}>
                  Encrypted & Private
                </Text>
              </View>
              <View style={styles.trustDot} />
              <View style={styles.trustItem}>
                <Ionicons name="heart-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.trustItemText, { color: colors.textSecondary }]}>
                  100% Confidential
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Footer Support Email Note */}
        <View style={styles.footerNoteContainer}>
          <Text style={[styles.footerSupportText, { color: colors.textTertiary }]}>
            Official Soulmate Care:{" "}
            <Text
              style={{ color: colors.accent, textDecorationLine: "underline" }}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              {SUPPORT_EMAIL}
            </Text>
          </Text>
          <Text style={[styles.footerCopyright, { color: colors.textTertiary }]}>
            Soulmate Dating App • All rights reserved
          </Text>
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
    paddingBottom: 40,
  },
  headerMailButton: {
    padding: 6,
  },

  /* Hero Section */
  heroWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  heroCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "600",
  },
  heroHeading: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtext: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  /* Section Common Blocks */
  sectionBlock: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  faqCountText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* Quick Support Grid (2x2) */
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  quickGridCard: {
    width: "48%",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  quickCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },

  /* Dating Advice Topics Carousel */
  topicsScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  topicCard: {
    width: 230,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  topicTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  topicIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  topicBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  topicSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  topicFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  topicReadMore: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* Category Filter Chips */
  categoryChipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
  },

  /* FAQ Accordion */
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  faqTagRow: {
    marginBottom: 4,
  },
  faqCategoryPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  faqCategoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  faqChevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  faqExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  faqTipsContainer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  tipsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  tipsHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  tipItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 4,
  },
  tipItemText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  /* Empty Search State */
  emptySearchBox: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  emptySearchDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  emptyResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  emptyResetText: {
    fontSize: 13,
    fontWeight: "700",
  },

  /* 24/7 Member Care Contact Card */
  contactCardContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  contactCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
  },
  contactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  contactIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  contactCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 3,
  },
  contactCardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  contactActionButtons: {
    gap: 10,
    marginBottom: 16,
  },
  primaryContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryContactBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondarySafetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondarySafetyBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  trustDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trustItemText: {
    fontSize: 11,
    fontWeight: "500",
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#9a9aa0",
  },

  /* Footer Note */
  footerNoteContainer: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 4,
  },
  footerSupportText: {
    fontSize: 12,
    fontWeight: "500",
  },
  footerCopyright: {
    fontSize: 11,
  },
});
