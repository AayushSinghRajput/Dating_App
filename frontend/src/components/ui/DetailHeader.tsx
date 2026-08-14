import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

interface DetailHeaderProps {
  title: string;
  onBack?: () => void;
  /** Extra content on the right (e.g. a "Clear All" text button). */
  right?: React.ReactNode;
}

// Flat, borderless header for pushed "detail" screens (back button + title)
// — a hairline bottom border replaces the old shadow/rounded-corner card
// look shared across Privacy, Notifications, Blocked Users, Language,
// Help & Support, Feedback, and Community Guidelines.
export default function DetailHeader({ title, onBack, right }: DetailHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
    >
      <View style={styles.row}>
        <Pressable
          style={styles.side}
          onPress={onBack || (() => router.back())}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[typography.h3, styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>{right}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { borderBottomWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  side: { minWidth: 32, alignItems: "flex-end" },
  title: { flex: 1, textAlign: "center" },
});
