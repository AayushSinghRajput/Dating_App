import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsFooter() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      <View style={styles.footerContent}>
        <Ionicons name="heart" size={16} color={colors.accent} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Made with love in Nepal
        </Text>
      </View>
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 2.1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: "center",
    marginTop: 16,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  footerText: { fontSize: 14, fontWeight: "600" },
  versionText: { fontSize: 12, fontWeight: "500" },
});
