import { Platform } from "react-native";

export const palette = {
  ink: "#07111F",
  inkSoft: "#0E1B2B",
  panel: "#122235",
  panelAlt: "#182B40",
  mint: "#57E3C2",
  mintDark: "#2AB99A",
  amber: "#FFBE6B",
  paper: "#F6F8FB",
  white: "#FFFFFF",
  text: "#F4F7FA",
  muted: "#91A2B6",
  line: "#24384E",
  danger: "#FF6B6B",
  success: "#65D99B",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  android: {
    elevation: 7,
  },
  default: {},
});
