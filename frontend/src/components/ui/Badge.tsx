import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";

type BadgeTone = "accent" | "info" | "success" | "warning";

interface BadgeProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: BadgeTone;
}

// Small pill used for verified/premium/super-like style indicators. Keeps
// that recurring pattern (icon + short label on a tinted pill) from being
// hand-rolled slightly differently on every screen that needs one.
export default function Badge({ label, icon, tone = "accent" }: BadgeProps) {
  const { colors } = useTheme();
  const toneColor = { accent: colors.accent, info: colors.info, success: colors.success, warning: colors.warning }[
    tone
  ];

  return (
    <View style={[styles.base, { backgroundColor: toneColor + "1A", borderColor: toneColor + "33" }]}>
      {icon && <Ionicons name={icon} size={12} color={toneColor} style={styles.icon} />}
      <Text style={[typography.caption, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  icon: { marginRight: 3 },
});
