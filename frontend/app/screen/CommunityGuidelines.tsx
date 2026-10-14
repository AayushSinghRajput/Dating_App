import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

interface Guideline {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  type: "positive" | "negative";
}

const GUIDELINES: Guideline[] = [
  {
    id: "1",
    category: "AUTHENTICITY",
    title: "Be Genuine & Authentic",
    description:
      "Use recent, real photos of yourself. Impersonation, celebrity pictures, or misleading profiles result in permanent hardware bans.",
    icon: "sparkles",
    color: "#10b981",
    type: "positive",
  },
  {
    id: "2",
    category: "CONSENT & BOUNDARIES",
    title: "Respect Boundaries & Consent",
    description:
      "A 'no' is always a complete sentence. Never pressure matches into sharing personal numbers, private photos, or meeting before they feel safe.",
    icon: "heart",
    color: "#e63946",
    type: "positive",
  },
  {
    id: "3",
    category: "ZERO TOLERANCE",
    title: "No Harassment or Hate Speech",
    description:
      "Bullying, discrimination, body shaming, and threats are strictly prohibited. Soulmate celebrates daters of all identities with equal respect.",
    icon: "hand-left",
    color: "#ef4444",
    type: "negative",
  },
  {
    id: "4",
    category: "FINANCIAL SAFETY",
    title: "No Scams or Money Requests",
    description:
      "Soulmate is strictly for romance. Never send or request money, cryptocurrency, loans, or promote commercial sales and paid channels.",
    icon: "cash-outline",
    color: "#f59e0b",
    type: "negative",
  },
  {
    id: "5",
    category: "AGE POLICY",
    title: "Strictly 18+ Dating Space",
    description:
      "All members must be 18 years of age or older. Accounts misrepresenting their age or involving underage content are permanently purged.",
    icon: "shield-checkmark",
    color: "#6366f1",
    type: "negative",
  },
  {
    id: "6",
    category: "DATA PRIVACY",
    title: "Protect Your Personal Details",
    description:
      "Keep your home address, financial accounts, and work schedule private until mutual trust is established over time.",
    icon: "lock-closed",
    color: "#0284c7",
    type: "positive",
  },
  {
    id: "7",
    category: "IN-PERSON DATING",
    title: "Meet Safely in Public Venues",
    description:
      "For first dates, choose public places (cafes, restaurants), arrange your own transport, and always share your location with a trusted friend.",
    icon: "cafe",
    color: "#14b8a6",
    type: "positive",
  },
  {
    id: "8",
    category: "COMMUNITY CARE",
    title: "Report Unsafe Behavior Confidentially",
    description:
      "Reporting is 100% private. When you flag inappropriate actions, our human Trust & Safety moderators review the report swiftly.",
    icon: "flag",
    color: "#8b5cf6",
    type: "positive",
  },
];

type FilterTab = "all" | "positive" | "negative";

export default function CommunityGuidelines() {
  const router = useRouter();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const handleBack = () => router.back();

  const handleTabChange = (tab: FilterTab) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  const filteredGuidelines = useMemo(() => {
    if (activeTab === "all") return GUIDELINES;
    return GUIDELINES.filter((g) => g.type === activeTab);
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Community Guidelines" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Trust & Respect Banner */}
        <View style={styles.heroOuter}>
          <LinearGradient
            colors={["#e63946", "#ff6b78"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="people" size={24} color="#ffffff" />
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>OUR RESPECT PLEDGE</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Love Starts with Respect</Text>
            <Text style={styles.heroSubtitle}>
              Soulmate is built on kindness, authenticity, and enthusiastic consent. We hold every dater to the highest standards of safety and care.
            </Text>

            {/* Value Pills */}
            <View style={styles.trustPillRow}>
              <View style={styles.trustPill}>
                <Ionicons name="heart-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>Kind Connections</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="sparkles-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>Zero Catfish</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="shield-checkmark-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>Safe Spaces</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === "all" && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => handleTabChange("all")}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: activeTab === "all" ? "#ffffff" : colors.text },
              ]}
            >
              All Rules ({GUIDELINES.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === "positive" && {
                backgroundColor: "#10b981",
                borderColor: "#10b981",
              },
            ]}
            onPress={() => handleTabChange("positive")}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: activeTab === "positive" ? "#ffffff" : colors.text },
              ]}
            >
              The Do&apos;s (Values)
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeTab === "negative" && {
                backgroundColor: "#ef4444",
                borderColor: "#ef4444",
              },
            ]}
            onPress={() => handleTabChange("negative")}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: activeTab === "negative" ? "#ffffff" : colors.text },
              ]}
            >
              Zero Tolerance
            </Text>
          </Pressable>
        </View>

        {/* Guidelines Cards List */}
        <View style={styles.guidelinesList}>
          {filteredGuidelines.map((item) => (
            <View
              key={item.id}
              style={[
                styles.ruleCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>

                <View style={styles.headerTitles}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor:
                          item.type === "negative" ? "#fee2e2" : "#e0f2fe",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color:
                            item.type === "negative" ? "#b91c1c" : "#0369a1",
                        },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  <Text style={[styles.ruleTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                </View>
              </View>

              <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Accountability & Enforcement Banner */}
        <View
          style={[
            styles.enforcementCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <View style={styles.enforcementIconWrap}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.enforcementTitle, { color: colors.text }]}>
              Accountability & Enforcement
            </Text>
            <Text style={[styles.enforcementText, { color: colors.textSecondary }]}>
              Violations are reviewed by our Safety Moderation team. Actions range from content removal to permanent hardware bans and referral to authorities where applicable.
            </Text>
          </View>
        </View>

        {/* Quick Links to Safety Center & Support */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
            onPress={() => router.push("/screen/SafetyCenter")}
          >
            <Ionicons name="shield-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                Safety Center
              </Text>
              <Text style={[styles.actionCardDesc, { color: colors.textSecondary }]}>
                First date guides & tips
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { backgroundColor: colors.surfaceAlt },
            ]}
            onPress={() => router.push("/screen/HelpSupport")}
          >
            <Ionicons name="help-buoy-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                Member Care
              </Text>
              <Text style={[styles.actionCardDesc, { color: colors.textSecondary }]}>
                Contact 24/7 support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  guidelinesList: {
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  ruleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitles: {
    flex: 1,
    gap: 3,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  ruleTitle: {
    fontSize: 15.5,
    fontWeight: "800",
  },
  ruleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  enforcementCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  enforcementIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  enforcementTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  enforcementText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    marginHorizontal: 16,
    gap: 10,
  },
  actionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  actionCardDesc: {
    fontSize: 11.5,
  },
});
