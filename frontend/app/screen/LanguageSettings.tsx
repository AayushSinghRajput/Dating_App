import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, SupportedLanguage } from "@/contexts/LanguageContext";
import DetailHeader from "@/src/components/ui/DetailHeader";

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇺🇸",
  ne: "🇳🇵",
  hi: "🇮🇳",
};

const LANGUAGE_SUBTITLES: Record<string, string> = {
  en: "English (United States & Global)",
  ne: "नेपाली (नेपाल र प्रवासी समुदाय)",
  hi: "हिन्दी (भारत और विश्व)",
};

export default function LanguageSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleSelectLanguage = async (selected: SupportedLanguage) => {
    if (selected.code === language) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    await setLanguage(selected.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Toast.show({
      type: "success",
      text1: t("languageScreen.changedTitle", "Language Updated"),
      text2: `${t("languageScreen.changedMessage", "App language has been set to")} ${selected.nativeName} (${selected.name})`,
      position: "top",
    });
  };

  const filteredLanguages = supportedLanguages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentLangObj =
    supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title={t("languageScreen.title", "Language")} onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Cultural Romance Banner */}
        <View style={styles.heroOuter}>
          <LinearGradient
            colors={["#e63946", "#ff6b78"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="language" size={24} color="#ffffff" />
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>CULTURAL CONNECTION</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Speak From the Heart</Text>
            <Text style={styles.heroSubtitle}>
              Connect and flirt in the language you feel most authentic in. Love flows best in your own mother tongue.
            </Text>

            {/* Language Pills */}
            <View style={styles.trustPillRow}>
              <View style={styles.trustPill}>
                <Text style={styles.flagIcon}>🇺🇸</Text>
                <Text style={styles.trustPillText}>English</Text>
              </View>
              <View style={styles.trustPill}>
                <Text style={styles.flagIcon}>🇳🇵</Text>
                <Text style={styles.trustPillText}>नेपाली</Text>
              </View>
              <View style={styles.trustPill}>
                <Text style={styles.flagIcon}>🇮🇳</Text>
                <Text style={styles.trustPillText}>हिन्दी</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Current Active Language Highlight */}
        <View
          style={[
            styles.currentCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.currentHeaderRow}>
            <View style={[styles.activeDot, { backgroundColor: "#10b981" }]} />
            <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
              CURRENTLY ACTIVE
            </Text>
          </View>

          <View style={styles.currentBodyRow}>
            <Text style={styles.currentFlag}>
              {LANGUAGE_FLAGS[currentLangObj.code] || "🌐"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currentNativeName, { color: colors.text }]}>
                {currentLangObj.nativeName}
              </Text>
              <Text style={[styles.currentEnglishName, { color: colors.textSecondary }]}>
                {currentLangObj.name} • {LANGUAGE_SUBTITLES[currentLangObj.code] || ""}
              </Text>
            </View>

            <View style={[styles.activePill, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Supported Languages Section */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            {t("languageScreen.supportedLanguages", "Available Languages")}
          </Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            {t("languageScreen.supportedSubtitle", "Select your preferred app language")}
          </Text>

          {/* Search Box */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search / खोज्नुहोस् / खोजें..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Language Options Group */}
          <View
            style={[
              styles.languagesGroup,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {filteredLanguages.map((langItem, idx) => {
              const isSelected = langItem.code === language;
              const flag = LANGUAGE_FLAGS[langItem.code] || "🌐";
              const subtitle = LANGUAGE_SUBTITLES[langItem.code] || "";

              return (
                <Pressable
                  key={langItem.code}
                  style={({ pressed }) => [
                    styles.languageRow,
                    isSelected && { backgroundColor: "rgba(230, 57, 70, 0.05)" },
                    idx !== filteredLanguages.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleSelectLanguage(langItem)}
                >
                  <Text style={styles.langFlag}>{flag}</Text>

                  <View style={styles.langTextWrap}>
                    <Text style={[styles.langNative, { color: colors.text }]}>
                      {langItem.nativeName}
                    </Text>
                    <Text style={[styles.langEnglish, { color: colors.textSecondary }]}>
                      {langItem.name} {subtitle ? `• ${subtitle}` : ""}
                    </Text>
                  </View>

                  <View style={styles.selectionWrap}>
                    {isSelected ? (
                      <View style={[styles.selectedCircle, { backgroundColor: colors.accent }]}>
                        <Ionicons name="checkmark" size={16} color="#ffffff" />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.unselectedCircle,
                          { borderColor: colors.border },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Translation Quality Note */}
        <View
          style={[
            styles.tipCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Ionicons name="heart-circle-outline" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              Authentic Local Dating
            </Text>
            <Text style={[styles.tipDesc, { color: colors.textSecondary }]}>
              Soulmate translations are carefully crafted by native speakers for respectful, intuitive dating terms, gestures, and safety alerts.
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
  flagIcon: {
    fontSize: 14,
  },
  trustPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  currentCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#e63946",
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  currentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  currentLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  currentBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currentFlag: {
    fontSize: 32,
  },
  currentNativeName: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 2,
  },
  currentEnglishName: {
    fontSize: 12,
    lineHeight: 16,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065f46",
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 12,
    lineHeight: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  languagesGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  langFlag: {
    fontSize: 26,
  },
  langTextWrap: {
    flex: 1,
    gap: 2,
  },
  langNative: {
    fontSize: 16,
    fontWeight: "700",
  },
  langEnglish: {
    fontSize: 12,
  },
  selectionWrap: {
    marginLeft: 8,
  },
  selectedCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  tipCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  tipDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
