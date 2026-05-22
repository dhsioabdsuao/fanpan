/**
 * Calculate the Equation of Time (均时差) for a given date.
 *
 * The Equation of Time accounts for the Earth's elliptical orbit around the Sun
 * and the tilt of the Earth's axis. It produces a correction that ranges from
 * approximately -16 minutes to +16 minutes throughout the year.
 *
 * This implementation uses the standard astronomical approximation
 * (equivalent to the NOAA Solar Calculations method).
 *
 * Formula:
 *   N = day of year (Jan 1 = 1)
 *   B = 2π × (N - 81) / 365
 *   EoT (minutes) = 9.87 × sin(2B) - 7.53 × cos(B) - 1.5 × sin(B)
 *
 * Accuracy: within 30 seconds year-round, sufficient for Bazi calculations.
 *
 * Reference values (approximate):
 *   Feb 14  → ~ -14 min
 *   Apr 15  → ~   0 min
 *   Jul 27  → ~  -6 min
 *   Nov 3   → ~ +16 min
 */
export function calculateEquationOfTime(date: Date): number {
  // Day of year (Jan 1 = 1)
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffMs = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  // Adjust for leap year: 365 days + any extra day past Feb 28
  const daysInYear = isLeapYear(date.getFullYear()) ? 366 : 365;

  const B = (2 * Math.PI * (dayOfYear - 81)) / daysInYear;

  const eotMinutes = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  return eotMinutes;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
