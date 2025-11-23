import type { Color } from "@/lib/colors";

/**
 * The epoch date when the game started.
 * This is used to calculate which color to show based on days elapsed.
 * Format: YYYY-MM-DD in UTC
 */
export const GAME_EPOCH = "2025-11-23";

/**
 * Gets a deterministic date string for today in YYYY-MM-DD format (UTC).
 * This ensures all users worldwide get the same color for the same calendar day.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the number of days between two date strings.
 * Used to determine which color index to use (Wordle-style sequential selection).
 */
export function getDaysSinceEpoch(dateString: string): number {
  const epochDate = new Date(GAME_EPOCH + "T00:00:00Z");
  const targetDate = new Date(dateString + "T00:00:00Z");
  const diffMs = targetDate.getTime() - epochDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Gets the daily color for a given date using sequential selection (like Wordle).
 * This ensures no color ever repeats - each day gets the next color in the list.
 */
export function getDailyColorForDate(
  colors: Color[],
  dateString: string
): Color {
  const dayNumber = getDaysSinceEpoch(dateString);
  // Use modulo to wrap around if we exceed the color list length
  const index = dayNumber % colors.length;
  return colors[index];
}

/**
 * @deprecated Legacy function - use getDaysSinceEpoch instead
 */
export function getSeedFromDate(dateString: string): number {
  return getDaysSinceEpoch(dateString);
}
