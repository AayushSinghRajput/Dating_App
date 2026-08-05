import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import SettingsCard from "../SettingsCard";

interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

interface SettingsSectionProps {
  title: string;
  description?: string;
  items: SettingsItem[];
  onItemPress: (item: SettingsItem) => void;
  isLogoutSection?: boolean;
}

export default function SettingsSection({
  title,
  description,
  items,
  onItemPress,
  isLogoutSection = false,
}: SettingsSectionProps) {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.sectionList}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.cardContainer,
              { backgroundColor: colors.surface, shadowColor: colors.shadow },
              index === 0 && styles.firstCard,
              index === items.length - 1 && styles.lastCard,
              isLogoutSection && { borderColor: colors.accentSoft, borderWidth: 1 },
            ]}
          >
            <SettingsCard
              item={item}
              onPress={() => onItemPress(item)}
              isLogout={isLogoutSection}
            />
            {index < items.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.surfaceAlt }]} />
            )}
          </View>
        ))}
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
  cardContainer: {
    borderRadius: 16,
    marginBottom: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  firstCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  lastCard: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  divider: { height: 1, marginHorizontal: 16 },
});
