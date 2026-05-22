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
  const provinceData = data.provinces.find(
    (p) => p.name === province,
  );
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
