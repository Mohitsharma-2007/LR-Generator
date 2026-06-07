import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current color scheme.
 * Always returns dark palette for this app.
 */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
