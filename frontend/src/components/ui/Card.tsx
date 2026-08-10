import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import { shadows } from "@/src/theme/shadows";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

// Standard elevated surface — every card-like container (profile cards, info
// sections, list rows) should use this instead of a one-off
// backgroundColor+borderRadius+shadow combo.
export default function Card({ children, onPress, padding = "lg", style, accessibilityLabel }: CardProps) {
  const { colors } = useTheme();
  const cardStyle = [
    styles.base,
    { backgroundColor: colors.surface, padding: spacing[padding], shadowColor: colors.shadow },
    shadows.md,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg },
  pressed: { opacity: 0.92 },
});
