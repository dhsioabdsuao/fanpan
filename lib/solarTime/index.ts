import type { BirthPlace, SolarTimeAdjustment } from './types';
import { calculateLongitudeOffset } from './longitudeOffset';
import { calculateEquationOfTime } from './equationOfTime';
import { lookupCoordinates } from './cityLookup';

/**
 * Convert a standard time (Beijing time / China Standard Time) to true solar time
 * for a specific birthplace.
 *
 * True Solar Time = Standard Time + Longitude Offset + Equation of Time
 *
 *   - Longitude Offset: (longitude - 120°) × 4 minutes
 *     Accounts for the birthplace being east or west of the 120°E meridian.
 *   - Equation of Time: up to ±16 minutes
 *     Accounts for Earth's elliptical orbit and axial tilt.
 */
export function adjustToSolarTime(
  standardTime: Date,
  birthPlace: BirthPlace,
): SolarTimeAdjustment {
  const coords = lookupCoordinates(
    birthPlace.province,
    birthPlace.city,
    birthPlace.district,
  );
  if (!coords) {
    throw new Error(
      `Unable to find coordinates for: ${birthPlace.province} ${birthPlace.city}${
        birthPlace.district ? ' ' + birthPlace.district : ''
      }`,
    );
  }

  const longitudeOffsetMinutes = calculateLongitudeOffset(coords.longitude);
  const equationOfTimeMinutes = calculateEquationOfTime(standardTime);
  const totalOffsetMinutes = longitudeOffsetMinutes + equationOfTimeMinutes;

  const solarTime = new Date(
    standardTime.getTime() + totalOffsetMinutes * 60 * 1000,
  );

  return {
    standardTime,
    birthPlace,
    longitude: coords.longitude,
    longitudeOffsetMinutes,
    equationOfTimeMinutes,
    totalOffsetMinutes,
    solarTime,
  };
}

export type { BirthPlace, SolarTimeAdjustment };
export { calculateLongitudeOffset } from './longitudeOffset';
export { calculateEquationOfTime } from './equationOfTime';
export {
  lookupCoordinates,
  getAllProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
} from './cityLookup';
