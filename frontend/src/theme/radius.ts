// Consistent corner rounding across cards, buttons, inputs, images, and modals.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999, // pills / circles
} as const;

export type RadiusKey = keyof typeof radius;
