import React from "react";
import { View, StyleSheet } from "react-native";
import { EmojiKeyboard, EmojiType } from "rn-emoji-keyboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";

export interface EmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
  onBackspace?: () => void;
  height?: number;
}

/**
 * Modern, high-performance emoji picker powered by rn-emoji-keyboard.
 * - Full Unicode 15.0 emoji catalog
 * - Categorized with skin tone selector & search bar
 * - Light/Dark theme synchronized with Soulmate design tokens
 * - Pure TypeScript & React Native with zero native dependencies
 */
export default function EmojiPicker({
  onEmojiSelected,
  height = 320,
}: EmojiPickerProps) {
  const { colors } = useTheme();

  const handleSelectEmoji = (emojiObject: EmojiType) => {
    Haptics.selectionAsync().catch(() => {});
    onEmojiSelected(emojiObject.emoji);
  };

  return (
    <View style={[styles.container, { height, backgroundColor: colors.surface }]}>
      <EmojiKeyboard
        onEmojiSelected={handleSelectEmoji}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="top"
        theme={{
          container: colors.surface,
          header: colors.text,
          category: {
            icon: colors.textTertiary,
            iconActive: colors.accent,
            container: "transparent",
            containerActive: colors.accentSoft,
          },
          search: {
            background: colors.surfaceAlt,
            text: colors.text,
            placeholder: colors.textTertiary,
            icon: colors.textTertiary,
          },
        }}
        styles={{
          container: {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
