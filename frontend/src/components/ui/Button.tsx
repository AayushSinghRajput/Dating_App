import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { typography } from "@/src/theme/typography";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "small";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// Comfortable touch target by default (48pt) per accessibility guidance;
// "small" is for compact contexts (e.g. inline card actions) but still
// clears the 40pt minimum most guidelines treat as an absolute floor.
const HEIGHTS: Record<ButtonSize, number> = { default: 48, small: 40 };

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "default",
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle: StyleProp<ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: colors.accentSoft },
    outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.accent },
    ghost: { backgroundColor: "transparent" },
    destructive: { backgroundColor: colors.error },
  }[variant];

  const textColor = {
    primary: "#fff",
    secondary: colors.accent,
    outline: colors.accent,
    ghost: colors.accent,
    destructive: "#fff",
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHTS[size], paddingHorizontal: spacing.xl },
        variantStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={styles.icon} />}
          <Text style={[typography.button, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    alignSelf: "flex-start",
  },
  fullWidth: { alignSelf: "stretch" },
  icon: { marginRight: spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
