import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function NotificationSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [promotionAlerts, setPromotionAlerts] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const NotificationOption = ({
    title,
    description,
    value,
    onValueChange,
    icon,
    isSectionHeader = false
  }: {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
    isSectionHeader?: boolean;
  }) => (
    <View style={[
      styles.option,
      { borderBottomColor: colors.border },
      isSectionHeader && [styles.sectionHeaderOption, { backgroundColor: colors.accentSoft, borderBottomColor: colors.accentSoftPressed }]
    ]}>
      <View style={styles.optionLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: colors.accentSoft },
          isSectionHeader && [styles.sectionHeaderIcon, { backgroundColor: colors.accent }]
        ]}>
          <Ionicons name={icon as any} size={20} color={colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }, isSectionHeader && [styles.sectionHeaderTitle, { color: colors.accent }]]}>{title}</Text>
          {description && <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accentSoft }}
        thumbColor={value ? colors.accent : colors.surfaceAlt}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Global Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Global Settings</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Manage your overall notification preferences
          </Text>

          <NotificationOption
            title="Push Notifications"
            description="Receive notifications on your device"
            value={pushNotifications}
            onValueChange={setPushNotifications}
            icon="notifications-outline"
            isSectionHeader={true}
          />

          <NotificationOption
            title="Email Notifications"
            description="Get notifications via email"
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            icon="mail-outline"
          />

          <NotificationOption
            title="Quiet Hours"
            description="Silence notifications during night time"
            value={quietHours}
            onValueChange={setQuietHours}
            icon="moon-outline"
          />
        </View>

        {/* Alert Types */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Types</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Choose what type of alerts you want to receive
          </Text>

          <NotificationOption
            title="Message Alerts"
            description="Get notified for new messages"
            value={messageAlerts}
            onValueChange={setMessageAlerts}
            icon="chatbubble-ellipses-outline"
          />

          <NotificationOption
            title="Match Alerts"
            description="Notifications for new matches"
            value={matchAlerts}
            onValueChange={setMatchAlerts}
            icon="heart-outline"
          />

          <NotificationOption
            title="Promotional Alerts"
            description="Updates about new features and offers"
            value={promotionAlerts}
            onValueChange={setPromotionAlerts}
            icon="megaphone-outline"
          />
        </View>

        {/* Notification Behavior */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Behavior</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Customize how notifications appear
          </Text>

          <NotificationOption
            title="Sound"
            description="Play sound for notifications"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            icon="volume-medium-outline"
          />

          <NotificationOption
            title="Vibration"
            description="Vibrate for notifications"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            icon="phone-portrait-outline"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={[styles.quickActionButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="notifications-off-outline" size={20} color={colors.accent} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Disable All</Text>
          </Pressable>

          <Pressable style={[styles.quickActionButton, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Snooze 1 Hour</Text>
          </Pressable>
        </View>

        {/* Info Section */}
        <View style={[styles.infoContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Notification Tips</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Enable match alerts to never miss a connection. Use quiet hours to avoid disturbances during your rest time.
            </Text>
          </View>
        </View>

        {/* Test Notification */}
        <Pressable style={[styles.testButton, { backgroundColor: colors.surface, borderColor: colors.accentSoftPressed, shadowColor: colors.shadow }]}>
          <Ionicons name="play-circle-outline" size={20} color={colors.accent} />
          <Text style={[styles.testButtonText, { color: colors.accent }]}>Test Notification</Text>
        </Pressable>
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
  sectionHeaderOption: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: -20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  sectionHeaderIcon: {},
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    lineHeight: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
