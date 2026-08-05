import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

interface Language {
  id: string;
  name: string;
  code: string;
  nativeName: string;
  isSelected: boolean;
}

export default function LanguageSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [languages, setLanguages] = useState<Language[]>([
    { id: "1", name: "English", code: "en", nativeName: "English", isSelected: true },
    { id: "2", name: "Spanish", code: "es", nativeName: "Español", isSelected: false },
    { id: "3", name: "French", code: "fr", nativeName: "Français", isSelected: false },
    { id: "4", name: "German", code: "de", nativeName: "Deutsch", isSelected: false },
    { id: "5", name: "Italian", code: "it", nativeName: "Italiano", isSelected: false },
    { id: "6", name: "Portuguese", code: "pt", nativeName: "Português", isSelected: false },
    { id: "7", name: "Russian", code: "ru", nativeName: "Русский", isSelected: false },
    { id: "8", name: "Japanese", code: "ja", nativeName: "日本語", isSelected: false },
    { id: "9", name: "Korean", code: "ko", nativeName: "한국어", isSelected: false },
    { id: "10", name: "Chinese (Simplified)", code: "zh", nativeName: "简体中文", isSelected: false },
    { id: "11", name: "Arabic", code: "ar", nativeName: "العربية", isSelected: false },
    { id: "12", name: "Hindi", code: "hi", nativeName: "हिन्दी", isSelected: false },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const selectLanguage = (languageId: string) => {
    const updatedLanguages = languages.map(lang => ({
      ...lang,
      isSelected: lang.id === languageId
    }));
    setLanguages(updatedLanguages);

    const selectedLang = languages.find(lang => lang.id === languageId);
    if (selectedLang) {
      Alert.alert(
        "Language Changed",
        `App language has been set to ${selectedLang.name}`,
        [{ text: "OK" }]
      );
    }
  };

  const filteredLanguages = languages.filter(language =>
    language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    language.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedLanguages = showAllLanguages ? filteredLanguages : filteredLanguages.slice(0, 6);

  const LanguageItem = ({ language }: { language: Language }) => (
    <Pressable
      style={[
        styles.languageItem,
        { backgroundColor: colors.surfaceAlt },
        language.isSelected && [styles.selectedLanguageItem, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]
      ]}
      onPress={() => selectLanguage(language.id)}
    >
      <View style={styles.languageInfo}>
        <Text style={[styles.languageName, { color: colors.text }]}>{language.name}</Text>
        <Text style={[styles.languageNativeName, { color: colors.textSecondary }]}>{language.nativeName}</Text>
      </View>

      <View style={styles.selectionIndicator}>
        {language.isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
        ) : (
          <View style={[styles.unselectedCircle, { borderColor: colors.textTertiary }]} />
        )}
      </View>
    </Pressable>
  );

  const PopularLanguageCard = ({ language }: { language: Language }) => (
    <Pressable
      style={[
        styles.popularLanguageCard,
        { backgroundColor: colors.surfaceAlt, borderColor: "transparent" },
        language.isSelected && [styles.selectedPopularCard, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]
      ]}
      onPress={() => selectLanguage(language.id)}
    >
      <Text style={[styles.popularLanguageName, { color: colors.text }]}>{language.name}</Text>
      <Text style={[styles.popularLanguageNative, { color: colors.textSecondary }]}>{language.nativeName}</Text>
      {language.isSelected && (
        <View style={[styles.popularSelectedBadge, { backgroundColor: colors.accent }]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      )}
    </Pressable>
  );

  const popularLanguages = languages.slice(0, 6);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Language</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Language Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Language</Text>
          <View style={[styles.currentLanguageCard, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <Ionicons name="language" size={24} color={colors.accent} />
            <View style={styles.currentLanguageInfo}>
              <Text style={[styles.currentLanguageName, { color: colors.text }]}>
                {languages.find(lang => lang.isSelected)?.name}
              </Text>
              <Text style={[styles.currentLanguageSubtitle, { color: colors.textSecondary }]}>
                App is currently in {languages.find(lang => lang.isSelected)?.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Popular Languages */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Languages</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Quickly switch to commonly used languages
          </Text>

          <View style={styles.popularLanguagesGrid}>
            {popularLanguages.map((language) => (
              <PopularLanguageCard key={language.id} language={language} />
            ))}
          </View>
        </View>

        {/* All Languages */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>All Languages</Text>
            <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>Search languages...</Text>
            </View>
          </View>

          <View style={styles.languagesList}>
            {displayedLanguages.map((language) => (
              <LanguageItem key={language.id} language={language} />
            ))}
          </View>

          {filteredLanguages.length > 6 && (
            <Pressable
              style={styles.showMoreButton}
              onPress={() => setShowAllLanguages(!showAllLanguages)}
            >
              <Text style={[styles.showMoreText, { color: colors.accent }]}>
                {showAllLanguages ? 'Show Less' : `Show All ${filteredLanguages.length} Languages`}
              </Text>
              <Ionicons
                name={showAllLanguages ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.accent}
              />
            </Pressable>
          )}
        </View>

        {/* Language Features */}
        <View style={[styles.featuresSection, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.featureItem, { borderBottomColor: colors.surfaceAlt }]}>
            <Ionicons name="globe-outline" size={20} color={colors.accent} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Global Community</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Connect with users from around the world in their preferred language
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.surfaceAlt }]}>
            <Ionicons name="sync-outline" size={20} color={colors.accent} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Real-time Translation</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Messages are automatically translated for seamless communication
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomColor: colors.surfaceAlt }]}>
            <Ionicons name="people-outline" size={20} color={colors.accent} />
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Better Matches</Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                Find matches who speak your language or want to learn it
              </Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
          <View style={styles.helpText}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>Need help with languages?</Text>
            <Text style={[styles.helpDescription, { color: colors.textSecondary }]}>
              Changing your language affects the app interface and matching preferences.
            </Text>
          </View>
          <Pressable style={[styles.helpButton, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <Text style={[styles.helpButtonText, { color: colors.accent }]}>Get Help</Text>
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
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop:16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeaderRow: {
    marginBottom: 16,
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
  currentLanguageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  currentLanguageInfo: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  currentLanguageSubtitle: {
    fontSize: 13,
  },
  popularLanguagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  popularLanguageCard: {
    flex: 1,
    minWidth: "30%",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
  },
  selectedPopularCard: {},
  popularLanguageName: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  popularLanguageNative: {
    fontSize: 11,
    textAlign: "center",
  },
  popularSelectedBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    flex: 1,
  },
  languagesList: {
    gap: 8,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  selectedLanguageItem: {
    borderWidth: 1,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 13,
  },
  selectionIndicator: {
    padding: 4,
  },
  unselectedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  featuresSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 13,
    lineHeight: 16,
  },
  helpButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  helpButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
