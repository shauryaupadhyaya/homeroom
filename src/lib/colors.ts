import type { BrandColor } from "../components/ui";

/** Literal hex mirrors of the CSS custom properties, for contexts (Recharts) that need real color values. */
export const CLASS_COLOR_HEX: Record<BrandColor, string> = {
  orange: "#ff6b35",
  sky: "#4fb8e8",
  lime: "#8bc63f",
  pink: "#ff6fa0",
  purple: "#8b7fe8",
};

export const CLASS_COLOR_SOFT_HEX: Record<BrandColor, string> = {
  orange: "#ffe1cc",
  sky: "#d8f1fb",
  lime: "#e4f4c8",
  pink: "#ffdcea",
  purple: "#e6e1fc",
};

export const CLASS_COLOR_DARK_HEX: Record<BrandColor, string> = {
  orange: "#e8551f",
  sky: "#2e9bcf",
  lime: "#6fa82f",
  pink: "#e8548a",
  purple: "#6f5fd1",
};
