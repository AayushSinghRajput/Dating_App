import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 64, xl: 96 };

interface AvatarProps {
  uri?: string | null;
  size?: AvatarSize;
  accessibilityLabel?: string;
}

const BLURHASH = "L5H2EC=PM+yV0g-mq.wG9c010J}I";

// Cached, placeholder-aware profile image. Use this instead of RN's plain
// <Image> for any profile photo — plain Image has no disk cache, so it
// re-downloads on every mount, which matters a lot in an image-heavy app
// like this one.
export default function Avatar({ uri, size = "md", accessibilityLabel }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZES[size];

  if (!uri) {
    return (
      <View
        style={[
          styles.fallback,
          { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor: colors.surfaceAlt },
        ]}
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="person" size={dimension * 0.5} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
      contentFit="cover"
      placeholder={{ blurhash: BLURHASH }}
      transition={200}
      accessibilityLabel={accessibilityLabel}
      cachePolicy="disk"
    />
  );
}

const styles = StyleSheet.create({
  fallback: { justifyContent: "center", alignItems: "center" },
});
