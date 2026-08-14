import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NotificationPreferences,
} from "@/services/notificationService";
import DetailHeader from "@/src/components/ui/DetailHeader";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  like: true,
  match: true,
  missed_call: true,
  favorite: true,
};

export default function NotificationSettings() {
  const router = useRouter();
  const { colors } = useTheme();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPreferences)
      .catch((error) => {
        Toast.show({ type: "error", text1: "Failed to load preferences", text2: error.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBack = () => router.back();

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const previous = preferences;
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (error: any) {
      setPreferences(previous);
      Toast.show({ type: "error", text1: "Failed to update", text2: error.message });
    } finally {
      setSavingKey(null);
    }
  };

  const NotificationOption = ({
    title,
    description,
    prefKey,
    icon,
  }: {
    title: string;
    description: string;
    prefKey: keyof NotificationPreferences;
    icon: string;
  }) => (
    <View style={[styles.option, { borderBottomColor: colors.border }]}>
      <View style={styles.optionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name={icon as any} size={20} color={colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      {savingKey === prefKey ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Switch
          value={preferences[prefKey]}
          onValueChange={(value) => handleToggle(prefKey, value)}
          trackColor={{ false: colors.border, true: colors.accentSoft }}
          thumbColor={preferences[prefKey] ? colors.accent : colors.surfaceAlt}
          ios_backgroundColor={colors.border}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Notifications" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Types</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Choose which notifications you want to receive
            </Text>

            <NotificationOption
              title="Likes"
              description="When someone likes your profile"
              prefKey="like"
              icon="heart-outline"
            />
            <NotificationOption
              title="Matches"
              description="When you match with someone"
              prefKey="match"
              icon="sparkles-outline"
            />
            <NotificationOption
              title="Missed Calls"
              description="When you miss an audio or video call"
              prefKey="missed_call"
              icon="call-outline"
            />
            <NotificationOption
              title="Favorites"
              description="When someone adds you to favorites"
              prefKey="favorite"
              icon="star-outline"
            />
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
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
});
