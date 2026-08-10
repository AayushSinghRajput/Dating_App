export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  accentSoftPressed: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  disabled: string;
  overlay: string;
  shadow: string;
  statusBarStyle: "light-content" | "dark-content";
}

export const lightColors: ThemeColors = {
  background: "#f8f9fa",
  surface: "#ffffff",
  surfaceAlt: "#f8f9fa",
  border: "#f0f0f0",
  text: "#1a1a1a",
  textSecondary: "#666666",
  textTertiary: "#9a9aa0",
  accent: "#e63946",
  accentSoft: "#fdeced",
  accentSoftPressed: "#fadadd",
  success: "#4CAF50",
  warning: "#e0a800",
  error: "#e05252",
  info: "#4A90E2",
  disabled: "#c7c7cc",
  overlay: "rgba(0,0,0,0.5)",
  shadow: "#000000",
  statusBarStyle: "dark-content",
};

export const darkColors: ThemeColors = {
  background: "#0f0f10",
  surface: "#1c1c1e",
  surfaceAlt: "#232326",
  border: "#2c2c2e",
  text: "#f2f2f2",
  textSecondary: "#a1a1a6",
  textTertiary: "#8e8e93",
  accent: "#ff6b78",
  accentSoft: "#3a1f22",
  accentSoftPressed: "#4a262a",
  success: "#34c759",
  warning: "#f0b429",
  error: "#ff6b6b",
  info: "#6aa8ff",
  disabled: "#48484a",
  overlay: "rgba(0,0,0,0.7)",
  shadow: "#000000",
  statusBarStyle: "light-content",
};
