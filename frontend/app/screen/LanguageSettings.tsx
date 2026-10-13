import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, SupportedLanguage } from "@/contexts/LanguageContext";
import DetailHeader from "@/src/components/ui/DetailHeader";
import { radius } from "@/src/theme/radius";

export default function LanguageSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = () => {
    router.back();
  };

  const handleSelectLanguage = async (selected: SupportedLanguage) => {
    if (selected.code === language) return;

    await setLanguage(selected.code);
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
        {/* Current Active Language Card */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("languageScreen.currentLanguage", "Current Language")}
          </Text>
          <View
            style={[
              styles.currentLanguageCard,
              { backgroundColor: colors.accentSoft, borderColor: colors.accent },
            ]}
          >
            <View style={[styles.languageIconCircle, { backgroundColor: colors.accent }]}>
              <Ionicons name="language" size={22} color="#fff" />
            </View>
            <View style={styles.currentLanguageInfo}>
              <Text style={[styles.currentLanguageName, { color: colors.text }]}>
                {currentLangObj.name}{" "}
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  ({currentLangObj.nativeName})
                </Text>
              </Text>
              <Text style={[styles.currentLanguageSubtitle, { color: colors.textSecondary }]}>
                {t("languageScreen.currentLanguageSubtitle", "App is currently in")}{" "}
                {currentLangObj.nativeName}
              </Text>
            </View>
          </View>
        </View>

        {/* Supported Languages List */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("languageScreen.supportedLanguages", "Supported Languages")}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {t("languageScreen.supportedSubtitle", "Select your preferred language")}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={[styles.searchContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search / खोज्नुहोस् / खोजें..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Languages Item List */}
          <View style={styles.languagesList}>
            {filteredLanguages.map((langItem) => {
              const isSelected = langItem.code === language;
              return (
                <Pressable
                  key={langItem.code}
                  style={[
                    styles.languageItem,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    isSelected && [
                      styles.selectedLanguageItem,
                      { backgroundColor: colors.accentSoft, borderColor: colors.accent },
                    ],
                  ]}
                  onPress={() => handleSelectLanguage(langItem)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageNativeName, { color: colors.text }]}>
                      {langItem.nativeName}
                    </Text>
                    <Text style={[styles.languageName, { color: colors.textSecondary }]}>
                      {langItem.name}
                    </Text>
                  </View>

                  <View style={styles.selectionIndicator}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                    ) : (
                      <View style={[styles.unselectedCircle, { borderColor: colors.textTertiary }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Informative Note Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
          <View style={styles.helpText}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              {t("languageScreen.helpTitle", "Need help with languages?")}
            </Text>
            <Text style={[styles.helpDescription, { color: colors.textSecondary }]}>
              {t("languageScreen.helpDescription", "Changing your language immediately updates the app interface and your display preferences.")}
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
    paddingBottom: 36,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 18,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  currentLanguageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
    gap: 14,
  },
  languageIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  currentLanguageInfo: {
    flex: 1,
  },
  currentLanguageName: {
    fontSize: 16,
    fontWeight: "700",
  },
  currentLanguageSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  languagesList: {
    gap: 10,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  selectedLanguageItem: {
    borderWidth: 1.5,
  },
  languageInfo: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: 16,
    fontWeight: "700",
  },
  languageName: {
    fontSize: 13,
    marginTop: 2,
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  unselectedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
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
    fontSize: 12,
    lineHeight: 18,
  },
});
