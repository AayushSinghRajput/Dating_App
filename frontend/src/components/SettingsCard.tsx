import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

// Define props interface with more flexible icon typing
interface SettingsCardProps {
  item: {
    id: string;
    title: string;
    icon: string; // Allow any string, but we'll handle invalid icons gracefully
    description?: string;
  };
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  isLogout?: boolean;
}

const SettingsCard: React.FC<SettingsCardProps> = ({
  item,
  onPress,
  style,
  isLogout = false,
}) => {
  const { colors } = useTheme();

  // Safe icon rendering - fallback to a default icon if the provided one is invalid
  const renderIcon = () => {
    try {
      // Check if the icon name exists in Ionicons
      if (item.icon in Ionicons.glyphMap) {
        return (
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={22}
            color={colors.accent}
          />
        );
      }
    } catch (error) {
      console.warn(`Invalid icon name: ${item.icon}`);
    }

    // Fallback icon
    return <Ionicons name="settings" size={22} color={colors.accent} />;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface },
        isLogout && [styles.logoutCard, { borderColor: colors.accentSoft }],
        pressed && styles.pressedCard,
        style,
      ]}
      onPress={onPress}
      android_ripple={{
        color: isLogout ? "rgba(230,57,70,0.1)" : "rgba(127,127,127,0.1)",
      }}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accentSoft }]}>
          {renderIcon()}
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isLogout && [styles.logoutTitle, { color: colors.accent }],
            ]}
          >
            {item.title}
          </Text>
          {item.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          )}
        </View>

        {!isLogout && (
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: "hidden",
  },
  logoutCard: {
    borderWidth: 1,
  },
  pressedCard: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  logoutTitle: {
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});

export default SettingsCard;
