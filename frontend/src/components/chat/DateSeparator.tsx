import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function DateSeparator({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dateSeparatorRow}>
      <View style={[styles.dateSeparatorPill, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.dateSeparatorText, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dateSeparatorRow: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateSeparatorPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
