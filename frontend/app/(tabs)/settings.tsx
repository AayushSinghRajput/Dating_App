import { useRouter } from "expo-router";
import { Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import settings from "../../assets/data/settingsdata";
import SettingsHeader from "../../src/components/settings/SettingsHeader";
import SettingsSection from "../../src/components/settings/SettingsSection";
import AppearanceSection from "../../src/components/settings/AppearanceSection";
import SettingsFooter from "../../src/components/settings/SettingsFooter";
import { useTheme } from "@/contexts/ThemeContext";
import { clearToken } from "@/utils/api";

interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

export default function Settings() {
  const router = useRouter();
  const { colors } = useTheme();

  const handlePress = (item: SettingsItem) => {
    if (!item) return;

    switch (item.title) {
      case "Edit Profile":
        router.push("/screen/ProfileEdit");
        break;
      case "Account Privacy":
        router.push("/screen/Privacy");
        break;
      case "Change Password":
        router.push("/screen/ChangePassword");
        break;
      case "Email & Verification":
        router.push("/screen/EmailSettings");
        break;
      case "Photo Verification":
        router.push("/screen/PhotoVerification");
        break;
      case "Safety Center":
        router.push("/screen/SafetyCenter");
        break;
      case "Invite Friends":
        router.push("/screen/ReferralProgram");
        break;
      case "Notifications":
        router.push("/screen/NotificationSettings");
        break;
      case "Payment & Subscriptions":
        router.push("/screen/PaymentSettings");
        break;
      case "Blocked Users":
        router.push("/screen/BlockedUsers");
        break;
      case "Language":
        router.push("/screen/LanguageSettings");
        break;
      case "Help & Support":
        router.push("/screen/HelpSupport");
        break;
      case "Logout":
        Alert.alert(
          "Logout",
          "Are you sure you want to logout?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Logout",
              style: "destructive",
              onPress: async () => {
                await clearToken();
                router.replace("/auth/login");
              },
            },
          ]
        );
        break;
      case "Delete Account":
        router.push("/screen/DeleteAccount");
        break;
      default:
        console.log(item.title, "pressed");
    }
  };

  // Group settings into logical sections
  const accountSettings = settings.filter((item) =>
    ["Edit Profile", "Account Privacy", "Change Password", "Email & Verification", "Photo Verification", "Notifications"].includes(item.title)
  );

  const safetySettings = settings.filter((item) => ["Safety Center"].includes(item.title));

  const preferencesSettings = settings.filter((item) =>
    ["Payment & Subscriptions", "Invite Friends", "Blocked Users", "Language"].includes(item.title)
  );

  const supportSettings = settings.filter((item) =>
    ["Help & Support"].includes(item.title)
  );

  const sessionSettings = settings.filter((item) =>
    ["Logout", "Delete Account"].includes(item.title)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <SettingsHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppearanceSection />

        <SettingsSection
          title="Account"
          description="Manage your profile and privacy"
          items={accountSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title="Safety"
          description="Stay safe when meeting matches in person"
          items={safetySettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title="Preferences"
          description="Customize your app experience"
          items={preferencesSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title="Support"
          description="Get help and information"
          items={supportSettings}
          onItemPress={handlePress}
        />

        <SettingsSection
          title="Session"
          description="Manage your account session"
          items={sessionSettings}
          onItemPress={handlePress}
          isLogoutSection
        />

        <SettingsFooter />
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
    paddingBottom: 20,
  },
});
