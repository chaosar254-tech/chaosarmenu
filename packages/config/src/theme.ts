export const theme = {
  colors: {
    background: "#F7F8FA",
    textPrimary: "#1F2937",
    navy: "#0F172A",
    borderLight: "#E5E7EB",
    accent: "#00B4D8",
    white: "#FFFFFF",
  },
  fonts: {
    primary: ["Inter", "system-ui", "sans-serif"].join(", "),
  },
} as const;

export type Theme = typeof theme;

