import { describe, it, expect } from 'vitest';
import {
  adjustToSolarTime,
  calculateLongitudeOffset,
  calculateEquationOfTime,
  lookupCoordinates,
  getAllProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
} from './index';

// ─── Longitude Offset ────────────────────────────────────────────────────────

describe('calculateLongitudeOffset', () => {
  it('Beijing (~116.4°) should have ~-14.37 min offset', () => {
    const offset = calculateLongitudeOffset(116.407387);
    expect(offset).toBeCloseTo(-14.37, 1);
  });

  it('Shanghai (~121.5°) should have ~+5.89 min offset', () => {
    const offset = calculateLongitudeOffset(121.473);
    expect(offset).toBeCloseTo(5.89, 1);
  });

  it('Urumqi (~87.6°) should have ~-129.5 min offset', () => {
    const offset = calculateLongitudeOffset(87.617);
    expect(offset).toBeCloseTo(-129.53, 1);
  });

  it('120°E meridian should have 0 offset', () => {
    expect(calculateLongitudeOffset(120)).toBe(0);
  });

  it('values east of 120° should be positive', () => {
    expect(calculateLongitudeOffset(126.6)).toBeGreaterThan(0); // Harbin
    expect(calculateLongitudeOffset(121.5)).toBeGreaterThan(0); // Shanghai
  });

  it('values west of 120° should be negative', () => {
    expect(calculateLongitudeOffset(116.4)).toBeLessThan(0); // Beijing
    expect(calculateLongitudeOffset(106.7)).toBeLessThan(0); // Chongqing
  });
});

// ─── Equation of Time ─────────────────────────────────────────────────────────

describe('calculateEquationOfTime', () => {
  // Reference: standard equation of time astronomical tables
  // Tolerance: ±1 minute (the formula is an approximation)

  it('Feb 14 should be ~ -14.6 min (Sun behind mean time)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 1, 14, 12, 0));
    expect(eot).toBeLessThan(-13);
    expect(eot).toBeGreaterThan(-16);
  });

  it('Apr 15 should be ~ 0 min (crossover point)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 3, 15, 12, 0));
    expect(Math.abs(eot)).toBeLessThan(1);
  });

  it('Jul 27 should be ~ -6.2 min (Sun behind mean time)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 6, 27, 12, 0));
    expect(eot).toBeLessThan(-5);
    expect(eot).toBeGreaterThan(-8);
  });

  it('Nov 3 should be ~ +16.4 min (Sun ahead of mean time)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 10, 3, 12, 0));
    expect(eot).toBeGreaterThan(15);
    expect(eot).toBeLessThan(18);
  });

  it('should handle leap year Feb 29', () => {
    // Feb 29, 1984 (leap year) — should not throw
    const eot = calculateEquationOfTime(new Date(1984, 1, 29, 12, 0));
    // Approximately -13 min for late Feb
    expect(eot).toBeLessThan(-10);
    expect(eot).toBeGreaterThan(-15);
  });

  it('should handle Jan 1 (near zero)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 0, 1, 12, 0));
    expect(Math.abs(eot)).toBeLessThan(5);
  });

  it('should handle Dec 31 (near zero)', () => {
    const eot = calculateEquationOfTime(new Date(2025, 11, 31, 12, 0));
    expect(Math.abs(eot)).toBeLessThan(5);
  });

  it('same date across different years should produce similar values', () => {
    const eot2024 = calculateEquationOfTime(new Date(2024, 2, 15, 12, 0));
    const eot2025 = calculateEquationOfTime(new Date(2025, 2, 15, 12, 0));
    // Should be within ~0.5 minutes across adjacent years (leap year shift)
    expect(Math.abs(eot2024 - eot2025)).toBeLessThan(0.5);
  });
});

// ─── City Lookup ──────────────────────────────────────────────────────────────

describe('lookupCoordinates', () => {
  it('should find 罗湖区 (Luohu district) with full path', () => {
    const coords = lookupCoordinates('广东省', '深圳市', '罗湖区');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(114.13, 1);
    expect(coords!.latitude).toBeCloseTo(22.55, 1);
  });

  it('should fallback to city when district not found', () => {
    const coords = lookupCoordinates('广东省', '深圳市');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(114.06, 1);
    expect(coords!.latitude).toBeCloseTo(22.54, 1);
  });

  it('should fallback to province when only province given', () => {
    const coords = lookupCoordinates('广东省', '');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(113.27, 1);
    expect(coords!.latitude).toBeCloseTo(23.13, 1);
  });

  it('should return null for non-existent province', () => {
    const coords = lookupCoordinates('不存在的省', '不存在市');
    expect(coords).toBeNull();
  });

  it('should return city fallback for non-existent district', () => {
    const coords = lookupCoordinates('广东省', '深圳市', '不存在的区');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(114.06, 1);
  });

  it('should find 东城区 (Dongcheng) district in Beijing', () => {
    const coords = lookupCoordinates('北京市', '北京市', '东城区');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(116.42, 1);
    expect(coords!.latitude).toBeCloseTo(39.93, 1);
  });

  it('should find 天山区 (Tianshan) district in Urumqi', () => {
    const coords = lookupCoordinates('新疆维吾尔自治区', '乌鲁木齐市', '天山区');
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(87.62, 1);
  });
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

describe('getAllProvinces', () => {
  it('should return at least 34 provinces (including HK/Macau/Taiwan)', () => {
    const provinces = getAllProvinces();
    expect(provinces.length).toBeGreaterThanOrEqual(34);
  });

  it('should include 北京市, 广东省, 香港特别行政区, 澳门特别行政区, 台湾省', () => {
    const provinces = getAllProvinces();
    expect(provinces).toContain('北京市');
    expect(provinces).toContain('广东省');
    expect(provinces).toContain('香港特别行政区');
    expect(provinces).toContain('澳门特别行政区');
    expect(provinces).toContain('台湾省');
  });
});

describe('getCitiesByProvince', () => {
  it('should return all cities in Guangdong', () => {
    const cities = getCitiesByProvince('广东省');
    expect(cities.length).toBeGreaterThanOrEqual(21); // Guangdong has 21 prefecture-level cities
  });

  it('should return empty array for unknown province', () => {
    const cities = getCitiesByProvince('不存在的省');
    expect(cities).toEqual([]);
  });
});

describe('getDistrictsByCity', () => {
  it('should return all districts in 深圳市', () => {
    const districts = getDistrictsByCity('广东省', '深圳市');
    expect(districts.length).toBeGreaterThanOrEqual(9); // Shenzhen has 9 districts
    expect(districts).toContain('罗湖区');
    expect(districts).toContain('南山区');
  });

  it('Beijing districts >= 16', () => {
    // Beijing has 16 districts (all at deep=2 under city level)
    // Count all districts across all Beijing cities
    const bjCities = getCitiesByProvince('北京市');
    let totalDistricts = 0;
    for (const city of bjCities) {
      totalDistricts += getDistrictsByCity('北京市', city).length;
    }
    expect(totalDistricts).toBeGreaterThanOrEqual(16);
  });

  it('Chongqing districts >= 37', () => {
    const cqCities = getCitiesByProvince('重庆市');
    let totalDistricts = 0;
    for (const city of cqCities) {
      totalDistricts += getDistrictsByCity('重庆市', city).length;
    }
    expect(totalDistricts).toBeGreaterThanOrEqual(37);
  });
});

// ─── Full Solar Time Adjustment ───────────────────────────────────────────────

describe('adjustToSolarTime', () => {
  // Test values computed from the actual formula.
  // Longitude offset + equation of time = total offset.

  it('1984-10-27 08:00 in Beijing (东城区) — longitude offset dominates', () => {
    const result = adjustToSolarTime(
      new Date(1984, 9, 27, 8, 0, 0),
      { province: '北京市', city: '北京市', district: '东城区' },
    );

    // Beijing 东城区 longitude: ~116.416°
    // Longitude offset: (116.416 - 120) × 4 ≈ -14.3 min
    // EoT (Oct 27): ~ +16.4 min
    // Total: ~ +2.0 min
    // Solar time: ~ 08:02
    expect(result.longitude).toBeCloseTo(116.42, 1);
    expect(result.longitudeOffsetMinutes).toBeLessThan(-14);
    expect(result.longitudeOffsetMinutes).toBeGreaterThan(-15);
    expect(result.equationOfTimeMinutes).toBeGreaterThan(15);
    expect(result.equationOfTimeMinutes).toBeLessThan(17);
    // Total offset near +2 minutes
    expect(result.totalOffsetMinutes).toBeGreaterThan(1);
    expect(result.totalOffsetMinutes).toBeLessThan(3);
    expect(result.solarTime.getHours()).toBe(8);
    expect(result.solarTime.getMinutes()).toBeGreaterThanOrEqual(1);
    expect(result.solarTime.getMinutes()).toBeLessThanOrEqual(3);
  });

  it('1984-10-27 08:00 in Urumqi (天山区) — large negative offset', () => {
    const result = adjustToSolarTime(
      new Date(1984, 9, 27, 8, 0, 0),
      { province: '新疆维吾尔自治区', city: '乌鲁木齐市', district: '天山区' },
    );

    // Urumqi 天山区 longitude: ~87.62°
    // Longitude offset: (87.62 - 120) × 4 ≈ -129.5 min
    // EoT (Oct 27): ~ +16.4 min
    // Total: ~ -113.1 min
    // Solar time: ~ 06:07
    expect(result.longitude).toBeCloseTo(87.62, 1);
    expect(result.longitudeOffsetMinutes).toBeLessThan(-128);
    expect(result.longitudeOffsetMinutes).toBeGreaterThan(-131);
    // Total offset ~ -113 min
    expect(result.totalOffsetMinutes).toBeLessThan(-112);
    expect(result.totalOffsetMinutes).toBeGreaterThan(-114);
    expect(result.solarTime.getHours()).toBe(6);
    expect(result.solarTime.getMinutes()).toBeGreaterThanOrEqual(6);
    expect(result.solarTime.getMinutes()).toBeLessThanOrEqual(8);
  });

  it('1984-10-27 08:00 at 120°E meridian — only EoT applies', () => {
    // Mock lookupCoordinates is not possible since we can't change coordinates,
    // but we can test a city near 120°E:
    // 杭州市 is at ~120.2°
    const result = adjustToSolarTime(
      new Date(1984, 9, 27, 8, 0, 0),
      { province: '浙江省', city: '杭州市' },
    );

    // Hangzhou longitude: ~120.2°
    // Longitude offset: (120.2 - 120) × 4 ≈ +0.8 min
    // EoT (Oct 27): ~ +16.4 min
    // Total: ~ +17.2 min
    expect(result.longitudeOffsetMinutes).toBeLessThan(2);
    expect(result.longitudeOffsetMinutes).toBeGreaterThan(-2);
    expect(result.equationOfTimeMinutes).toBeGreaterThan(15);
    expect(result.solarTime.getHours()).toBe(8);
    expect(result.solarTime.getMinutes()).toBeGreaterThan(15);
    expect(result.solarTime.getMinutes()).toBeLessThan(20);
  });

  it('should throw for unknown location', () => {
    expect(() =>
      adjustToSolarTime(
        new Date(2024, 0, 1, 12, 0),
        { province: '火星', city: '不存在' },
      ),
    ).toThrow();
  });

  // ─── Boundary Cases ───────────────────────────────────────────────────────

  it('should handle pre-midnight conversion that stays same day', () => {
    // 23:00 standard time in Shanghai (east of 120°, positive offset)
    // Longitude: 121.47°, offset: (121.47 - 120) * 4 ≈ +5.9 min
    // If EoT is small, total offset < 60 min, stays same day
    const result = adjustToSolarTime(
      new Date(2025, 3, 15, 23, 0, 0), // Apr 15, EoT ≈ 0
      { province: '上海市', city: '上海市' },
    );
    // Should still be same day, hour near 23
    expect(result.solarTime.getDate()).toBe(15);
    expect(result.solarTime.getHours()).toBe(23);
  });

  it('should handle early-morning conversion that stays same day', () => {
    // 00:30 standard time in Urumqi (west of 120°, large negative offset)
    // Offset ~ -129 min → would go back to previous day
    const result = adjustToSolarTime(
      new Date(2025, 3, 15, 0, 30, 0),
      { province: '新疆维吾尔自治区', city: '乌鲁木齐市' },
    );
    // Should cross to previous day: ~ 22:20-ish on Apr 14
    expect(result.solarTime.getDate()).toBe(14);
    expect(result.solarTime.getHours()).toBeGreaterThanOrEqual(21);
    expect(result.solarTime.getHours()).toBeLessThanOrEqual(23);
  });

  it('should handle leap year Feb 29', () => {
    const result = adjustToSolarTime(
      new Date(1984, 1, 29, 12, 0, 0),
      { province: '北京市', city: '北京市' },
    );
    // Should not throw, should produce valid date
    expect(result.solarTime.getFullYear()).toBe(1984);
    expect(result.solarTime.getMonth()).toBe(1); // February
    expect(result.solarTime.getDate()).toBe(29);
  });

  it('should handle year boundary (Dec 31 → Jan 1 or vice versa)', () => {
    // Dec 31 23:00 in Urumqi → crosses to Jan 1 previous year? No, Urumqi offset is negative
    // Actually at Dec 31 with negative offset, could go back to Dec 31 earlier
    // Let's test Dec 31 00:30 in Urumqi (negative offset ~ -140 min including EoT)
    // That would go to ~Dec 30 22:10
    const result = adjustToSolarTime(
      new Date(2025, 11, 31, 0, 30, 0),
      { province: '新疆维吾尔自治区', city: '乌鲁木齐市' },
    );
    // Should have crossed to previous day
    expect(result.solarTime.getDate()).toBe(30);
    expect(result.solarTime.getMonth()).toBe(11); // December
    expect(result.solarTime.getFullYear()).toBe(2025);
  });

  it('should preserve standardTime in the result', () => {
    const input = new Date(1984, 9, 27, 8, 0, 0);
    const result = adjustToSolarTime(input, {
      province: '北京市',
      city: '北京市',
      district: '东城区',
    });
    expect(result.standardTime.getTime()).toBe(input.getTime());
  });

  it('should include birthplace in the result', () => {
    const birthPlace = { province: '北京市', city: '北京市', district: '东城区' };
    const result = adjustToSolarTime(
      new Date(1984, 9, 27, 8, 0, 0),
      birthPlace,
    );
    expect(result.birthPlace).toEqual(birthPlace);
  });
});
