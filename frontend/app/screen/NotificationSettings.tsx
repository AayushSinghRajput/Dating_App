import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function NotificationSettings() {
  const router = useRouter();
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
    <View style={[styles.option, isSectionHeader && styles.sectionHeaderOption]}>
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, isSectionHeader && styles.sectionHeaderIcon]}>
          <Ionicons name={icon as any} size={20} color={isSectionHeader ? "#FF6B6B" : "#FF6B6B"} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, isSectionHeader && styles.sectionHeaderTitle]}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#f0f0f0', true: '#FFE5E5' }}
        thumbColor={value ? "#FF6B6B" : "#f4f3f4"}
        ios_backgroundColor="#f0f0f0"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Global Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Settings</Text>
          <Text style={styles.sectionDescription}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Types</Text>
          <Text style={styles.sectionDescription}>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Behavior</Text>
          <Text style={styles.sectionDescription}>
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
          <Pressable style={styles.quickActionButton}>
            <Ionicons name="notifications-off-outline" size={20} color="#FF6B6B" />
            <Text style={styles.quickActionText}>Disable All</Text>
          </Pressable>
          
          <Pressable style={styles.quickActionButton}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.quickActionText}>Snooze 1 Hour</Text>
          </Pressable>
        </View>

        {/* Info Section */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={16} color="#666" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Notification Tips</Text>
            <Text style={styles.infoText}>
              Enable match alerts to never miss a connection. Use quiet hours to avoid disturbances during your rest time.
            </Text>
          </View>
        </View>

        {/* Test Notification */}
        <Pressable style={styles.testButton}>
          <Ionicons name="play-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.testButtonText}>Test Notification</Text>
        </Pressable>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
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
    color: "#1a1a1a",
  },
  headerPlaceholder: {
    width: 40,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop:16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
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
    borderBottomColor: "#f8f9fa",
  },
  sectionHeaderOption: {
    backgroundColor: "#FFF5F5",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginTop: -20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomColor: "#FFE5E5",
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
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionHeaderIcon: {
    backgroundColor: "#FF6B6B",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    color: "#666",
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
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0F9FF",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F4FF",
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFE5E5",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
  },
});