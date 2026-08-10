import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";
import Button from "@/src/components/ui/Button";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Standard "nothing here yet" layout — icon, short explanation, optional
// next step. Used for empty lists AND recoverable errors (pass a "retry"
// action) so those two states look and feel like one consistent pattern
// instead of every screen inventing its own.
export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name={icon} size={32} color={colors.accent} />
      </View>
      <Text style={[typography.h3, styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {description && (
        <Text
          style={[
            typography.body,
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: { textAlign: "center", marginBottom: spacing.sm },
  description: { textAlign: "center", lineHeight: 20 },
  action: { marginTop: spacing.xl, alignSelf: "center" },
});
