import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";

const OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { mode: "light", label: "Light", icon: "sunny-outline" },
  { mode: "dark", label: "Dark", icon: "moon-outline" },
  { mode: "system", label: "System", icon: "phone-portrait-outline" },
];

export default function AppearanceSection() {
  const { mode, setMode, colors } = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Choose how Soulmate looks on your device
        </Text>
      </View>

      <View style={styles.sectionList}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, shadowColor: colors.shadow },
          ]}
        >
          <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceAlt }]}>
            {OPTIONS.map((option) => {
              const isActive = mode === option.mode;
              return (
                <Pressable
                  key={option.mode}
                  style={[styles.segment, isActive && { backgroundColor: colors.accent }]}
                  onPress={() => setMode(option.mode)}
                >
                  <Ionicons
                    name={option.icon}
                    size={17}
                    color={isActive ? "#fff" : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: isActive ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 8 },
  sectionHeader: { paddingVertical: 16, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  sectionDescription: { fontSize: 14, fontWeight: "500" },
  sectionList: { paddingHorizontal: 20 },
  card: {
    borderRadius: 16,
    padding: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
});
