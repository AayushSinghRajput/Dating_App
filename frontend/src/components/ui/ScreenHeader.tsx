import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";

export interface ScreenHeaderAction {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  badge?: number;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Replaces the title/subtitle block entirely (e.g. a logo lockup). */
  left?: React.ReactNode;
  actions?: ScreenHeaderAction[];
}

// Flat, borderless header used across top-level tab screens — a hairline
// bottom border replaces the old shadow/gradient "card" look.
export default function ScreenHeader({ title, subtitle, left, actions }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {left ? (
            left
          ) : (
            <>
              {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
              {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </>
          )}
        </View>

        {actions && actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Pressable
                key={action.accessibilityLabel}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.accessibilityLabel}
                hitSlop={8}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <Ionicons
                  name={action.icon}
                  size={23}
                  color={action.active ? colors.accent : colors.textSecondary}
                />
                {!!action.badge && (
                  <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
                    <Text style={styles.badgeText}>{action.badge > 9 ? "9+" : action.badge}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    minHeight: 48,
  },
  left: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  actionButton: {
    position: "relative",
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});
