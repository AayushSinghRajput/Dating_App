import { TextStyle } from "react-native";

// No custom font is loaded in this project — these use the OS system font
// (San Francisco / Roboto) deliberately, so nothing here sets fontFamily.
// If a brand font is added later, set it once in each style below.
type TypographyStyle = Pick<TextStyle, "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing">;

export const typography: Record<
  "display" | "h1" | "h2" | "h3" | "bodyLarge" | "body" | "bodySmall" | "caption" | "label" | "button",
  TypographyStyle
> = {
  display: { fontSize: 34, fontWeight: "800", lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: "800", lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  bodyLarge: { fontSize: 17, fontWeight: "400", lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 21 },
  bodySmall: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  label: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  button: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
};

export type TypographyVariant = keyof typeof typography;
