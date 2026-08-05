import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function Privacy() {
  const router = useRouter();
  const { colors } = useTheme();
  const [showProfile, setShowProfile] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [shareLocation, setShareLocation] = useState(false);
  const [dataCollection, setDataCollection] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  const handleBack = () => {
    router.back();
  };

  const PrivacyOption = ({ 
    title, 
    description, 
    value, 
    onValueChange,
    icon 
  }: {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={[styles.option, { borderBottomColor: colors.border }]}>
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name={icon as any} size={20} color={colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accentSoft }}
        thumbColor={value ? colors.accent : "#f4f3f4"}
        ios_backgroundColor={colors.border}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Visibility</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Control who can see your profile and information
          </Text>

          <PrivacyOption
            title="Show my profile to everyone"
            description="Your profile will be visible to all users"
            value={showProfile}
            onValueChange={setShowProfile}
            icon="eye-outline"
          />
          
          <PrivacyOption
            title="Show online status"
            description="Let others see when you're online"
            value={showOnlineStatus}
            onValueChange={setShowOnlineStatus}
            icon="radio-button-on-outline"
          />
          
          <PrivacyOption
            title="Share approximate location"
            description="Show your city/region to nearby users"
            value={shareLocation}
            onValueChange={setShareLocation}
            icon="location-outline"
          />
        </View>

        {/* Communication Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Communication</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Manage how others can interact with you
          </Text>

          <PrivacyOption
            title="Allow messages from strangers"
            description="Receive messages from users you haven't matched with"
            value={allowMessages}
            onValueChange={setAllowMessages}
            icon="chatbubble-outline"
          />
          
          <PrivacyOption
            title="Push notifications"
            description="Receive notifications for new messages and matches"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            icon="notifications-outline"
          />
        </View>

        {/* Data & Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Privacy</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Control how your data is used
          </Text>

          <PrivacyOption
            title="Data collection for improvement"
            description="Help us improve the app with anonymous usage data"
            value={dataCollection}
            onValueChange={setDataCollection}
            icon="analytics-outline"
          />
        </View>

        {/* Additional Privacy Options */}
        <View style={[styles.additionalOptions, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Pressable style={[styles.additionalOption, { borderBottomColor: colors.border }]}>
            <View style={styles.additionalOptionLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.additionalOptionText, { color: colors.textSecondary }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={[styles.additionalOption, { borderBottomColor: colors.border }]}>
            <View style={styles.additionalOptionLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.additionalOptionText, { color: colors.textSecondary }]}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>

          <Pressable style={[styles.additionalOption, { borderBottomColor: colors.border }]}>
            <View style={styles.additionalOptionLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.additionalOptionText, { color: colors.textSecondary }]}>Privacy Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your privacy settings help us protect your personal information and ensure a safe experience.
          </Text>
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F4FF",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "500",
  },
});