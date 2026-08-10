import { useEffect, useRef } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { radius } from "@/src/theme/radius";

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

// Shimmering placeholder for content that's still loading. Prefer this over
// a bare spinner wherever the eventual content has a known shape (profile
// cards, list rows) — it reads as "this is about to appear" rather than
// "the app is doing something unknown".
export default function Skeleton({ width = "100%", height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.surfaceAlt, opacity: pulse },
        style,
      ]}
    />
  );
}
