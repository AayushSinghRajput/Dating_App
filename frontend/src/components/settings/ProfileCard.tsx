import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile } from "@/services/profileService";
import Avatar from "@/src/components/ui/Avatar";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";

export default function ProfileCard() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setName(profile.name || profile.user?.username || null);
        setAvatarUrl(profile.profileImage || null);
      })
      .catch(() => {});
  }, []);

  return (
    <Pressable
      onPress={() => router.push("/screen/ProfileEdit")}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, shadowColor: colors.shadow },
        pressed && styles.pressed,
      ]}
    >
      <Avatar uri={avatarUrl} size="lg" accessibilityLabel="Your profile photo" />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name || "Your Profile"}
        </Text>
        <Text style={[styles.editLink, { color: colors.accent }]}>Edit Profile</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.92 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  editLink: { fontSize: 13, fontWeight: "600" },
});
