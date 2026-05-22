/**
 * Calculate longitude offset for true solar time.
 *
 * China Standard Time (CST) is based on the 120°E meridian.
 * For every degree of longitude away from 120°E, the offset is 4 minutes
 * (the Sun moves 1° every 4 minutes).
 *
 * Formula: offsetMinutes = (longitude - 120) × 4
 *
 * Examples:
 *   Beijing  (116.4°): (116.4 - 120) × 4 = -14.4 minutes
 *   Urumqi   (87.6°):  (87.6 - 120) × 4  = -129.6 minutes
 *   120°E:             (120 - 120) × 4    = 0 minutes
 */
export function calculateLongitudeOffset(longitude: number): number {
  return (longitude - 120) * 4;
}
