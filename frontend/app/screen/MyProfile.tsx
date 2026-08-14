import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile, Profile } from "@/services/profileService";
import Avatar from "@/src/components/ui/Avatar";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";

export default function MyProfile() {
  const router = useRouter();
  const { colors } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, { color: colors.text }]}>My Profile</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.push("/screen/ProfileEdit")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Ionicons name="create-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !profile ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>No profile data found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <Avatar uri={profile.profileImage} size="xl" accessibilityLabel="Your profile photo" />
            <Text style={[typography.h1, { color: colors.text, marginTop: spacing.md }]}>
              {profile.name || profile.user?.username || "Your Profile"}
            </Text>
            {profile.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{profile.location}</Text>
              </View>
            )}
          </View>

          {profile.aboutMe && (
            <Section title="About Me" icon="document-text-outline" colors={colors}>
              <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                {profile.aboutMe}
              </Text>
            </Section>
          )}

          {profile.prompts && profile.prompts.length > 0 && (
            <Section title="My Prompts" icon="chatbubbles-outline" colors={colors}>
              {profile.prompts.map((prompt, index) => (
                <View
                  key={index}
                  style={[
                    styles.promptCard,
                    { backgroundColor: colors.accentSoft },
                    index > 0 && { marginTop: spacing.md },
                  ]}
                >
                  <Text style={[typography.label, { color: colors.accent }]}>{prompt.question}</Text>
                  <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs }]}>
                    {prompt.answer}
                  </Text>
                </View>
              ))}
            </Section>
          )}

          <Section title="Personal Info" icon="person-circle-outline" colors={colors}>
            <InfoRow icon="calendar-outline" label="Age" value={profile.age ? String(profile.age) : undefined} colors={colors} />
            <InfoRow icon="male-female-outline" label="Gender" value={profile.gender} colors={colors} />
            <InfoRow icon="heart-outline" label="Interested In" value={profile.interestedIn} colors={colors} />
          </Section>

          {profile.hobbies && profile.hobbies.length > 0 && (
            <Section title="Hobbies & Interests" icon="game-controller-outline" colors={colors}>
              <View style={styles.hobbiesWrapper}>
                {profile.hobbies.map((hobby, index) => (
                  <View key={index} style={[styles.hobbyBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.hobbyText}>{hobby}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {(profile.education || profile.profession) && (
            <Section title="Education & Work" icon="school-outline" colors={colors}>
              <InfoRow icon="school-outline" label="Education" value={profile.education} colors={colors} />
              <InfoRow icon="briefcase-outline" label="Work" value={profile.profession} colors={colors} />
            </Section>
          )}

          {profile.relationshipGoals && (
            <Section title="Relationship Goals" icon="flag-outline" colors={colors}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>{profile.relationshipGoals}</Text>
            </Section>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  colors,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  colors: ReturnType<typeof useTheme>["colors"];
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={[typography.h3, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  if (!value) return null;
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Text style={[typography.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[typography.body, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { padding: spacing.xs },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  avatarSection: { alignItems: "center", marginBottom: spacing.xl },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  section: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  promptCard: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hobbiesWrapper: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  hobbyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  hobbyText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
