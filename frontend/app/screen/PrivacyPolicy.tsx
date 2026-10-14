import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import DetailHeader from "@/src/components/ui/DetailHeader";
import {
  SOULMATE_POLICY_SECTIONS,
  downloadSoulmatePolicyPdf,
} from "@/src/utils/policyPdfGenerator";

export default function PrivacyPolicy() {
  const router = useRouter();
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleDownloadPdf = async () => {
    if (downloading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setDownloading(true);
      Toast.show({
        type: "info",
        text1: "Preparing Soulmate PDF",
        text2: "Generating your branded privacy policy document...",
      });

      const result = await downloadSoulmatePolicyPdf();

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Policy Download Ready",
          text2: "Soulmate Privacy Policy has been generated successfully.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Download Failed",
          text2: result.error || "Could not generate policy document.",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Failed to download policy PDF",
      });
    } finally {
      setDownloading(false);
    }
  };

  const toggleSection = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const getSectionIcon = (id: string): any => {
    switch (id) {
      case "1":
        return "heart-circle-outline";
      case "2":
        return "file-tray-full-outline";
      case "3":
        return "sparkles-outline";
      case "4":
        return "share-social-outline";
      case "5":
        return "navigate-circle-outline";
      case "6":
        return "finger-print-outline";
      case "7":
        return "shield-checkmark-outline";
      case "8":
        return "alert-circle-outline";
      case "9":
        return "trash-bin-outline";
      case "10":
        return "mail-unread-outline";
      default:
        return "document-text-outline";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Privacy Policy" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header Card */}
        <View style={styles.heroOuter}>
          <LinearGradient
            colors={["#e63946", "#ff6b78", "#ff85a1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconBadge}>
                <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
              </View>
              <View style={styles.officialPill}>
                <Text style={styles.officialPillText}>OFFICIAL DOCUMENT</Text>
              </View>
            </View>

            <Text style={styles.heroBrand}>Soulmate Privacy & Trust</Text>
            <Text style={styles.heroSubtitle}>
              Where genuine connections meet uncompromising security. We safeguard your identity, photos, and private conversations.
            </Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroMetaText}>Updated: Oct 2026</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="document-text-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroMetaText}>v3.4 Official</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="shield-checkmark-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroMetaText}>GDPR & CCPA</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Soulmate Trust Highlights */}
        <View style={styles.highlightRow}>
          <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.highlightIconBadge, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.highlightText, { color: colors.text }]} numberOfLines={2}>
              Zero Data Sale
            </Text>
          </View>

          <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.highlightIconBadge, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="eye-off" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.highlightText, { color: colors.text }]} numberOfLines={2}>
              Incognito Stealth
            </Text>
          </View>

          <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.highlightIconBadge, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="lock-closed" size={18} color={colors.accent} />
            </View>
            <Text style={[styles.highlightText, { color: colors.text }]} numberOfLines={2}>
              TLS 1.3 Encrypted
            </Text>
          </View>
        </View>

        {/* Download PDF Action Section */}
        <View style={[styles.pdfCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pdfHeaderRow}>
            <View style={[styles.pdfIconWrapper, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="document-text" size={24} color={colors.accent} />
            </View>
            <View style={styles.pdfHeaderText}>
              <View style={styles.pdfBadgeRow}>
                <Text style={[styles.pdfTitle, { color: colors.text }]}>Download Policy (PDF)</Text>
                <View style={[styles.pdfBadge, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.pdfBadgeText, { color: colors.accent }]}>OFFICIAL PDF</Text>
                </View>
              </View>
              <Text style={[styles.pdfDescription, { color: colors.textSecondary }]}>
                Get the complete Soulmate Privacy Policy with legal seal and DPO certification for your offline records.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
              downloading && styles.downloadButtonDisabled,
            ]}
            onPress={handleDownloadPdf}
            disabled={downloading}
          >
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.downloadGradient}
            >
              {downloading ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.downloadButtonText}>Generating Soulmate PDF...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-down-circle-outline" size={20} color="#ffffff" />
                  <Text style={styles.downloadButtonText}>Download Soulmate Policy</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Policy Sections Accordion */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Policy Articles & Terms</Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            Tap any section to expand details and data practices
          </Text>
        </View>

        <View style={styles.articlesList}>
          {SOULMATE_POLICY_SECTIONS.map((section) => {
            const isExpanded = expandedSection === section.id;
            return (
              <View
                key={section.id}
                style={[
                  styles.articleCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isExpanded ? colors.accent : colors.border,
                  },
                ]}
              >
                <Pressable
                  style={styles.articleHeader}
                  onPress={() => toggleSection(section.id)}
                >
                  <View style={[styles.articleIconCircle, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={getSectionIcon(section.id)} size={18} color={colors.accent} />
                  </View>
                  <Text style={[styles.articleTitle, { color: colors.text }]}>
                    {section.title}
                  </Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={isExpanded ? colors.accent : colors.textTertiary}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={[styles.articleBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.articleContent, { color: colors.textSecondary }]}>
                      {section.content}
                    </Text>

                    {section.highlights && section.highlights.length > 0 && (
                      <View style={[styles.highlightsContainer, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.highlightsTitle, { color: colors.text }]}>
                          Key Takeaways
                        </Text>
                        {section.highlights.map((highlight, idx) => (
                          <View key={idx} style={styles.highlightItem}>
                            <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
                            <Text style={[styles.highlightItemText, { color: colors.textSecondary }]}>
                              {highlight}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact DPO Card */}
        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.contactHeader}>
            <View style={[styles.contactIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="mail" size={22} color={colors.accent} />
            </View>
            <View style={styles.contactHeaderText}>
              <Text style={[styles.contactTitle, { color: colors.text }]}>
                Have Questions or Data Inquiries?
              </Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                Our Data Protection Officer and Trust Team are available to assist with any privacy inquiries.
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.emailButton, { backgroundColor: colors.accentSoft }]}
            onPress={() => Linking.openURL("mailto:soulmatelumi@gmail.com")}
          >
            <Ionicons name="paper-plane-outline" size={16} color={colors.accent} />
            <Text style={[styles.emailButtonText, { color: colors.accent }]}>
              soulmatelumi@gmail.com
            </Text>
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
    flexGrow: 1,
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
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  officialPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  officialPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroBrand: {
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
    marginBottom: 18,
  },
  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  heroMetaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  highlightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  highlightCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  highlightIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },
  pdfCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3,
  },
  pdfHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  pdfIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  pdfHeaderText: {
    flex: 1,
  },
  pdfBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pdfTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  pdfBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pdfBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pdfDescription: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  downloadButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  downloadButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  downloadButtonDisabled: {
    opacity: 0.65,
  },
  downloadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 9,
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sectionHeaderWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 3,
  },
  sectionSubheading: {
    fontSize: 12.5,
  },
  articlesList: {
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  articleCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  articleHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },
  articleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },
  articleBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  articleContent: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  highlightsContainer: {
    borderRadius: 12,
    padding: 12,
    gap: 7,
  },
  highlightsTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  highlightItemText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  contactCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactHeaderText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  emailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  emailButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
  }
});