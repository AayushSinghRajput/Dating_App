import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ShowParams {
  title?: string;
  message?: string;
  options: ActionSheetOption[];
}

// Module-level pub-sub so showActionSheet() can be called from anywhere
// (screens, utils) without threading state/props through the tree — same
// pattern react-native-toast-message uses for Toast.show().
let listener: ((params: ShowParams) => void) | null = null;

export function showActionSheet(params: ShowParams) {
  listener?.(params);
}

export default function GlobalActionSheet() {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState<ShowParams>({ options: [] });

  useEffect(() => {
    listener = (p) => {
      setParams(p);
      setVisible(true);
    };
    return () => {
      listener = null;
    };
  }, []);

  const close = () => setVisible(false);

  const handleOptionPress = (option: ActionSheetOption) => {
    close();
    // let the sheet start closing before the action's own UI (e.g. another
    // Alert, navigation) takes over
    setTimeout(() => option.onPress(), 50);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <View style={styles.sheetWrapper}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {(params.title || params.message) && (
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                {params.title && (
                  <Text style={[styles.title, { color: colors.textSecondary }]}>{params.title}</Text>
                )}
                {params.message && (
                  <Text style={[styles.message, { color: colors.textTertiary }]}>{params.message}</Text>
                )}
              </View>
            )}
            {params.options.map((option, index) => (
              <Pressable
                key={option.label + index}
                style={[
                  styles.option,
                  index < params.options.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleOptionPress(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: option.destructive ? "#e63946" : colors.accent },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </Pressable>

          <Pressable style={[styles.cancelButton, { backgroundColor: colors.surface }]} onPress={close}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetWrapper: {
    padding: 10,
    gap: 8,
  },
  sheet: {
    borderRadius: 14,
    overflow: "hidden",
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  message: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  option: {
    paddingVertical: 16,
    alignItems: "center",
  },
  optionText: {
    fontSize: 17,
    fontWeight: "500",
  },
  cancelButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
