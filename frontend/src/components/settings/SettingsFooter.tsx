import React from "react";
import { View, Text, StyleSheet } from "react-native";
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
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>Version 1.0.0</Text>
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
  versionText: { fontSize: 12, fontWeight: "500" },
});
