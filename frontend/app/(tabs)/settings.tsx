import { useRouter } from "expo-router";
import { Alert, StyleSheet, ScrollView, View } from "react-native";
import settingsData from "../../assets/data/settingsdata";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import ProfileCard from "../../src/components/settings/ProfileCard";
import SettingsSection from "../../src/components/settings/SettingsSection";
import AppearanceSection from "../../src/components/settings/AppearanceSection";
import SettingsFooter from "../../src/components/settings/SettingsFooter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { clearToken } from "@/services/apiClient";

interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getSettingTitle = (id: string, defaultTitle: string) => {
    switch (id) {
      case "2":
        return t("settings.accountPrivacy", defaultTitle);
      case "10":
        return t("settings.changePassword", defaultTitle);
      case "11":
        return t("settings.emailVerification", defaultTitle);
      case "12":
        return t("settings.photoVerification", defaultTitle);
      case "13":
        return t("settings.safetyCenter", defaultTitle);
      case "14":
        return t("settings.inviteFriends", defaultTitle);
      case "3":
        return t("settings.notifications", defaultTitle);
      case "4":
        return t("settings.payment", defaultTitle);
      case "5":
        return t("settings.blockedUsers", defaultTitle);
      case "6":
        return t("settings.language", defaultTitle);
      case "7":
        return t("settings.helpSupport", defaultTitle);
      case "8":
        return t("settings.logout", defaultTitle);
      case "9":
        return t("settings.deleteAccount", defaultTitle);
      default:
        return defaultTitle;
    }
  };

  const handlePress = (item: SettingsItem) => {
    if (!item) return;

    switch (item.id) {
      case "2":
        router.push("/screen/Privacy");
        break;
      case "10":
        router.push("/screen/ChangePassword");
        break;
      case "11":
        router.push("/screen/EmailSettings");
        break;
      case "12":
        router.push("/screen/PhotoVerification");
        break;
      case "13":
        router.push("/screen/SafetyCenter");
        break;
      case "14":
        router.push("/screen/ReferralProgram");
        break;
      case "3":
        router.push("/screen/NotificationSettings");
        break;
      case "4":
        router.push("/screen/PaymentSettings");
        break;
      case "5":
        router.push("/screen/BlockedUsers");
        break;
      case "6":
        router.push("/screen/LanguageSettings");
        break;
      case "7":
        router.push("/screen/HelpSupport");
        break;
      case "8":
        Alert.alert(
          t("settings.logoutConfirmTitle", "Log Out"),
          t("settings.logoutConfirmMessage", "Are you sure you want to log out of Soulmate?"),
          [
            {
              text: t("common.cancel", "Cancel"),
              style: "cancel",
            },
            {
              text: t("settings.logout", "Log Out"),
              style: "destructive",
              onPress: async () => {
                await clearToken();
                router.replace("/auth/login");
              },
            },
          ]
        );
        break;
      case "9":
        router.push("/screen/DeleteAccount");
        break;
      default:
        console.log(item.title, "pressed");
    }
  };

  // Translate all settings items dynamically
  const localizedSettings: SettingsItem[] = settingsData.map((item) => ({
    ...item,
    title: getSettingTitle(item.id, item.title),
  }));

  // Group settings into logical sections
  const accountSettings = localizedSettings.filter((item) =>
    ["2", "10", "11", "12", "3"].includes(item.id)
  );

  const safetySettings = localizedSettings.filter((item) =>
    ["13"].includes(item.id)
  );

  const preferencesSettings = localizedSettings.filter((item) =>
    ["4", "14", "5", "6"].includes(item.id)
  );

  const supportSettings = localizedSettings.filter((item) =>
    ["7"].includes(item.id)
  );

  const sessionSettings = localizedSettings.filter((item) =>
    ["8", "9"].includes(item.id)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t("settings.title", "Settings")}
        subtitle={t("settings.subtitle", "Manage your account preferences")}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileCard />

        <AppearanceSection />

        <SettingsSection
          title={t("settings.accountSection", "Account")}
          description={t("settings.accountDesc", "Manage your profile and privacy")}
          items={accountSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title={t("settings.safetySection", "Safety")}
          description={t("settings.safetyDesc", "Stay safe when meeting matches in person")}
          items={safetySettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title={t("settings.preferencesSection", "Preferences")}
          description={t("settings.preferencesDesc", "Customize your app experience")}
          items={preferencesSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title={t("settings.helpSupport", "Help & Support")}
          items={supportSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title={t("settings.accountSection", "Account")}
          items={sessionSettings}
          onItemPress={handlePress}
        />

        <SettingsFooter />
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
    paddingBottom: 20,
  },
});
