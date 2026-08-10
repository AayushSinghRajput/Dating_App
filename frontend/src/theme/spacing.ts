// 4/8pt spacing scale — every gap, padding, and margin in the app should
// come from here rather than a one-off number, so rhythm stays consistent
// across screens.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
