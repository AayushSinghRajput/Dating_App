import { View, Text, Switch, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile, setIncognitoModeApi } from "@/services/profileService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function Privacy() {
  const router = useRouter();
  const { colors } = useTheme();
  const [showProfile, setShowProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((profile) => setShowProfile(!profile.incognito))
      .catch((error: any) => {
        Toast.show({ type: "error", text1: "Failed to load privacy settings", text2: error.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleToggleVisibility = async (value: boolean) => {
    const previous = showProfile;
    setShowProfile(value);
    setSaving(true);
    try {
      await setIncognitoModeApi(!value);
      Toast.show({
        type: "success",
        text1: value ? "Your profile is visible again" : "Incognito mode enabled",
        text2: value
          ? "New people can discover your profile."
          : "You're hidden from discovery. Existing matches and chats are unaffected.",
      });
    } catch (error: any) {
      setShowProfile(previous);
      Toast.show({ type: "error", text1: "Failed to update", text2: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Privacy & Security" onBack={handleBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Visibility</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Control who can discover your profile
          </Text>

          <View style={[styles.option, { borderBottomColor: "transparent" }]}>
            <View style={styles.optionLeft}>
              <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={showProfile ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {showProfile ? "Show my profile to everyone" : "Incognito mode"}
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  {showProfile
                    ? "New people can find and match with you"
                    : "Hidden from discovery. Existing matches and chats still work."}
                </Text>
              </View>
            </View>
            {loading || saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Switch
                value={showProfile}
                onValueChange={handleToggleVisibility}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={showProfile ? colors.accent : "#f4f3f4"}
                ios_backgroundColor={colors.border}
              />
            )}
          </View>
        </View>

        {/* Additional Privacy Options */}
        <View style={[styles.additionalOptions, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Pressable
            style={[styles.additionalOption, { borderBottomColor: colors.border }]}
            onPress={() => router.push("/screen/PrivacyPolicy")}
          >
            <View style={styles.additionalOptionLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.additionalOptionText, { color: colors.textSecondary }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
    paddingBottom: 30,
  },
  section: {
    marginHorizontal: 16,
    marginTop:16,
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
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
  },
  additionalOptions: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  additionalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  additionalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  additionalOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
