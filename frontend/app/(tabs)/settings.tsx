import { useRouter } from "expo-router";
import { Alert, FlatList, StyleSheet, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import settings from "../../assets/data/settingsdata";
import SettingsCard from "../../src/components/SettingsCard";
import { clearToken } from "@/utils/api";

// Define TypeScript interfaces
interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

export default function Settings() {
  const router = useRouter();

  const handlePress = (item: SettingsItem) => {
    if (!item) return;

    switch (item.title) {
      case "Edit Profile":
        router.push("/screen/ProfileEdit");
        break;
      case "Account Privacy":
        router.push("/screen/Privacy");
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
              style: "cancel" 
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
      default:
        console.log(item.title, "pressed");
    }
  };

  const renderSectionHeader = (title: string, description?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && <Text style={styles.sectionDescription}>{description}</Text>}
    </View>
  );

  // Group settings into logical sections
  const accountSettings = settings.filter(item => 
    ["Edit Profile", "Account Privacy", "Notifications"].includes(item.title)
  );

  const preferencesSettings = settings.filter(item =>
    ["Payment & Subscriptions", "Blocked Users", "Language"].includes(item.title)
  );

  const supportSettings = settings.filter(item =>
    ["Help & Support"].includes(item.title)
  );

  const sessionSettings = settings.filter(item =>
    ["Logout"].includes(item.title)
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-sharp" size={28} color="#FF6B6B" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account preferences</Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        {accountSettings.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader("Account", "Manage your profile and privacy")}
            <View style={styles.sectionList}>
              {accountSettings.map((item, index) => (
                <View 
                  key={item.id}
                  style={[
                    styles.cardContainer, 
                    index === 0 && styles.firstCard,
                    index === accountSettings.length - 1 && styles.lastCard
                  ]}
                >
                  <SettingsCard
                    item={item}
                    onPress={() => handlePress(item)}
                  />
                  {index < accountSettings.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Preferences Section */}
        {preferencesSettings.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader("Preferences", "Customize your app experience")}
            <View style={styles.sectionList}>
              {preferencesSettings.map((item, index) => (
                <View 
                  key={item.id}
                  style={[
                    styles.cardContainer, 
                    index === 0 && styles.firstCard,
                    index === preferencesSettings.length - 1 && styles.lastCard
                  ]}
                >
                  <SettingsCard
                    item={item}
                    onPress={() => handlePress(item)}
                  />
                  {index < preferencesSettings.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Support Section */}
        {supportSettings.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader("Support", "Get help and information")}
            <View style={styles.sectionList}>
              {supportSettings.map((item, index) => (
                <View 
                  key={item.id}
                  style={[
                    styles.cardContainer, 
                    index === 0 && styles.firstCard,
                    index === supportSettings.length - 1 && styles.lastCard
                  ]}
                >
                  <SettingsCard
                    item={item}
                    onPress={() => handlePress(item)}
                  />
                  {index < supportSettings.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Session Section */}
        {sessionSettings.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader("Session", "Manage your account session")}
            <View style={styles.sectionList}>
              {sessionSettings.map((item, index) => (
                <View 
                  key={item.id}
                  style={[styles.cardContainer, styles.logoutCard]}
                >
                  <SettingsCard
                    item={item}
                    onPress={() => handlePress(item)}
                    isLogout={true}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer inside ScrollView */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Ionicons name="heart" size={16} color="#FF6B6B" />
            <Text style={styles.footerText}>Made with love in Nepal</Text>
          </View>
          <Text style={styles.versionText}>Version 2.1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE5E5",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sectionList: {
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  firstCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  lastCard: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  logoutCard: {
    borderColor: "#FFE5E5",
    borderWidth: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
  },
  footer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
    marginTop: 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
});