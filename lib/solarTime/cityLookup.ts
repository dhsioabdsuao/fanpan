import chinaCoords from '@/lib/data/china-coords.json';

interface DistrictData {
  name: string;
  longitude: number;
  latitude: number;
}

interface CityData {
  name: string;
  longitude: number;
  latitude: number;
  districts: DistrictData[];
}

interface ProvinceData {
  name: string;
  longitude: number;
  latitude: number;
  cities: CityData[];
}

interface ChinaCoords {
  provinces: ProvinceData[];
}

const data = chinaCoords as ChinaCoords;

// 省名常见后缀：用于从简称（如"河南"）反查全名（如"河南省"）
const PROVINCE_SUFFIXES = [
  '特别行政区',
  '壮族自治区',
  '回族自治区',
  '维吾尔自治区',
  '自治区',
  '省',
  '市',
]

/**
 * Resolve a possibly-abbreviated province name to the real ProvinceData.
 * Exact match first; if that fails, try fuzzy matching against real names
 * (prefix or suffix-stripped).  Only resolves when the input matches exactly
 * one real province — ambiguous input returns null (fail safe).
 */
function resolveProvince(
  input: string,
  provinces: ProvinceData[],
): ProvinceData | null {
  // 1. Exact match (no overhead for the normal case)
  const exact = provinces.find((p) => p.name === input)
  if (exact) return exact

  // 2. Input is a prefix of a real province name (e.g. "河南" → "河南省")
  const byPrefix = provinces.filter((p) => p.name.startsWith(input))
  if (byPrefix.length === 1) return byPrefix[0]

  // 3. Input = real province name minus a known suffix
  const bySuffix = provinces.filter((p) =>
    PROVINCE_SUFFIXES.some(
      (suf) => p.name.endsWith(suf) && p.name.slice(0, -suf.length) === input,
    ),
  )
  if (bySuffix.length === 1) return bySuffix[0]

  // Ambiguous or no match → null (caller handles gracefully)
  return null
}

/**
 * Look up the coordinates (longitude, latitude) for a given birthplace.
 * Falls back from district → city → province if the more specific level
 * is not found.
 */
export function lookupCoordinates(
  province: string,
  city: string,
  district?: string,
): { longitude: number; latitude: number } | null {
  const provinceData = resolveProvince(province, data.provinces);
  if (!provinceData) return null;

  const cityData = provinceData.cities.find((c) => c.name === city);
  if (!cityData) {
    // Fallback to province center
    return {
      longitude: provinceData.longitude,
      latitude: provinceData.latitude,
    };
  }

  if (district) {
    const districtData = cityData.districts.find((d) => d.name === district);
    if (districtData) {
      return {
        longitude: districtData.longitude,
        latitude: districtData.latitude,
      };
    }
    // Fallback to city center if district not found
  }

  return {
    longitude: cityData.longitude,
    latitude: cityData.latitude,
  };
}

export function getAllProvinces(): string[] {
  return data.provinces.map((p) => p.name);
}

export function getCitiesByProvince(province: string): string[] {
  const provinceData = data.provinces.find((p) => p.name === province);
  if (!provinceData) return [];
  return provinceData.cities.map((c) => c.name);
}

export function getDistrictsByCity(province: string, city: string): string[] {
  const provinceData = data.provinces.find((p) => p.name === province);
  if (!provinceData) return [];
  const cityData = provinceData.cities.find((c) => c.name === city);
  if (!cityData) return [];
  return cityData.districts.map((d) => d.name);
}
