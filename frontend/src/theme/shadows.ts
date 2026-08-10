import { Platform } from "react-native";

// Elevation presets, iOS shadow / Android elevation. Deliberately excludes
// shadowColor — merge that from the active theme (`colors.shadow`) at the
// call site, since it needs to differ between light and dark mode:
//   style={[styles.card, shadows.md, { shadowColor: colors.shadow }]}
function preset(offsetY: number, opacity: number, blurRadius: number, elevation: number) {
  return Platform.select({
    ios: {
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius,
    },
    android: { elevation },
    default: {},
  });
}

export const shadows = {
  sm: preset(1, 0.06, 4, 2),
  md: preset(2, 0.08, 12, 4),
  lg: preset(4, 0.14, 20, 8),
};

export type ShadowKey = keyof typeof shadows;
