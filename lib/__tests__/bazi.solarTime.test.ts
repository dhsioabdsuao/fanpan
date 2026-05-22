import { describe, it, expect } from 'vitest';
import { calculateBazi } from '../bazi';
import type { BaziInput } from '@/types/bazi';

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return {
    year: 2000,
    month: 6,
    day: 15,
    hour: 10,
    minute: 0,
    gender: 'male',
    isLunar: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 测试 1: 不传 birthPlace 时行为与原始完全一致
// ═══════════════════════════════════════════════════════════════════════════════
//
// 目的: 验证引入 birthPlace 可选字段后，不传 birthPlace 时的代码路径
// 与原 bazi.test.ts 中测试 9 的输出完全一致。
//
// 原始输入: 1990-06-15 14:30, 男, 公历, 无出生地
//
// 推导链（来自原测试 9，已验证正确）:
//   - 年柱: 庚午（1990 庚午年，已过立春 2 月 4 日）
//   - 月柱: 壬午（芒种 6 月 6 日～小暑 7 月 7 日，午月。庚年 午月 = 壬午）
//   - 日柱: 辛亥（1990-06-15 日柱 = 辛亥）
//   - 时柱: 乙未（辛日未时 = 乙未，14:30 在未时 13:00-15:00）
//
// 回归保证: 只要这个测试通过，就确保不给 birthPlace 的调用方不受影响。

describe('Test 1: No birthPlace — original behavior preserved', () => {
  it('1990-06-15 14:30 without birthPlace matches original test 9', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
    }));

    // 四柱与原测试 9 完全一致
    expect(result.pillars.year.stem).toBe('庚');
    expect(result.pillars.year.branch).toBe('午');
    expect(result.pillars.month.stem).toBe('壬');
    expect(result.pillars.month.branch).toBe('午');
    expect(result.pillars.day.stem).toBe('辛');
    expect(result.pillars.day.branch).toBe('亥');
    expect(result.pillars.hour.stem).toBe('乙');
    expect(result.pillars.hour.branch).toBe('未');

    // solarTimeAdjustment 应为 null（未提供出生地）
    expect(result.solarTimeAdjustment).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 测试 2: 乌鲁木齐凌晨出生，跨日界 —— 日柱、时柱均变
// ═══════════════════════════════════════════════════════════════════════════════
//
// 目的: 验证经度差极大（乌鲁木齐 ~87.6°E）且在凌晨出生时，
// 真太阳时换算会跨越日界，导致日柱和时柱都发生变化。
//
// 原始输入:
//   1990-06-15 00:30 北京时间
//   出生地: 新疆维吾尔自治区 / 乌鲁木齐市 / 天山区
//
// 推导链:
//   1) 天山区经度 = 87.631986°（来自 china-coords.json）
//   2) 经度差 = (87.631986 - 120) × 4 = -129.472 分钟 = -2h 9m 28s
//      （乌鲁木齐在 120°E 以西约 32.4°，太阳到达晚约 129.5 分钟）
//   3) 均时差（1990-06-15 是第 166 天，非闰年 365 天）:
//      B = 2π × (166 - 81) / 365 = 2π × 85/365 ≈ 1.4632 rad
//      EoT = 9.87×sin(2B) - 7.53×cos(B) - 1.5×sin(B)
//          = 9.87×0.2138 - 7.53×0.1086 - 1.5×0.9941
//          ≈ 2.110 - 0.818 - 1.491 = -0.199 min ≈ -12 秒
//   4) 总修正 = -129.472 + (-0.199) = -129.665 分钟 ≈ -2h 9m 40s
//   5) 真太阳时 = 1990-06-15 00:30 + (-129.665 min)
//               = 1990-06-14 22:20:20
//      → 跨日界！日期从 6 月 15 日变为 6 月 14 日
//      → 时辰从 子时 (23:00-01:00) 变为 亥时 (21:00-23:00)
//
// 原四柱 (标准时间 1990-06-15 00:30):
//   - 年: 庚午（1990 年立春后）
//   - 月: 壬午（芒种后小暑前，午月）
//   - 日: 辛亥（1990-06-15 日柱）
//   - 时: 戊子（00:30 在子时；辛日 子时 = 戊子）
//
// 换算后四柱 (真太阳时 1990-06-14 22:20):
//   - 年: 庚午（年份不变，仍在庚午年内）
//   - 月: 壬午（月份不变，仍在午月内）
//   - 日: 庚戌（1990-06-14 日柱，比辛亥早一天）
//   - 时: 丁亥（22:20 在亥时 21:00-23:00；庚日 亥时 = 丁亥）
//
// 结论: 日柱从辛亥 → 庚戌，时柱从戊子 → 丁亥，命局完全不同。

describe('Test 2: Urumqi midnight — crosses day boundary', () => {
  it('1990-06-15 00:30 in Urumqi → solar 1990-06-14 22:20, day+hour pillars change', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 6, day: 15, hour: 0, minute: 30,
      birthPlace: {
        province: '新疆维吾尔自治区',
        city: '乌鲁木齐市',
        district: '天山区',
      },
    }));

    // 验证 solarTimeAdjustment 存在
    expect(result.solarTimeAdjustment).not.toBeNull();
    const adj = result.solarTimeAdjustment!;

    // 经度验证
    expect(adj.longitude).toBeCloseTo(87.63, 1);

    // 经度差: 约 -129.5 分钟
    expect(adj.longitudeOffsetMinutes).toBeLessThan(-128);
    expect(adj.longitudeOffsetMinutes).toBeGreaterThan(-131);

    // 均时差: 约 -0.2 分钟 (6 月中旬接近零)
    expect(Math.abs(adj.equationOfTimeMinutes)).toBeLessThan(1);

    // 总修正: 约 -130 分钟
    expect(adj.totalOffsetMinutes).toBeLessThan(-128);
    expect(adj.totalOffsetMinutes).toBeGreaterThan(-131);

    // 真太阳时应为前一天 22:20 左右
    expect(adj.solarTime.getDate()).toBe(14); // 跨日到 6 月 14 日
    expect(adj.solarTime.getHours()).toBe(22);
    expect(adj.solarTime.getMinutes()).toBeGreaterThanOrEqual(19);
    expect(adj.solarTime.getMinutes()).toBeLessThanOrEqual(21);

    // 年柱不变（仍在庚午年内）
    expect(result.pillars.year.stem).toBe('庚');
    expect(result.pillars.year.branch).toBe('午');

    // 月柱不变（仍在午月内）
    expect(result.pillars.month.stem).toBe('壬');
    expect(result.pillars.month.branch).toBe('午');

    // 日柱变为 庚戌（6 月 14 日，比原 6 月 15 日早一天）
    expect(result.pillars.day.stem).toBe('庚');
    expect(result.pillars.day.branch).toBe('戌');

    // 时柱变为 丁亥（亥时 21-23 点，庚日亥时）
    expect(result.pillars.hour.stem).toBe('丁');
    expect(result.pillars.hour.branch).toBe('亥');

    // 日主也变了（从辛 → 庚）
    expect(result.dayMaster).toBe('庚');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 测试 3: 北京本地出生，经度差很小，四柱不变
// ═══════════════════════════════════════════════════════════════════════════════
//
// 注: 本测试预期四柱(甲子/甲戌/甲午/己巳)来源于 lunar-typescript 库的
// Solar.fromYmdHms(1984, 10, 27, 10, 0, 0).getLunar() 输出，非独立手工验算。
// 本测试的保障目的是验证"当真太阳时换算偏移很小时，calculateBazi 输出四柱不变"，
// 属于接入回归保障，不验证四柱绝对正确性。lunar-typescript 库本身的正确性
// 由原 13 个排盘测试(已独立数学验证)保障。
//
// 目的: 验证在接近 120°E 的地点上，经度差修正很小，加上均时差后
// 总修正量不足以跨越任何时辰/日界，四柱应保持不变。
//
// 原始输入:
//   1984-10-27 10:00 北京时间
//   出生地: 北京市 / 北京市 / 东城区
//
// 推导链:
//   1) 东城区经度 = 116.416334°（来自 china-coords.json）
//   2) 经度差 = (116.416334 - 120) × 4 = -14.335 分钟 = -14m 20s
//      （北京在东经 116.4°，仅比 120° 标准经线偏西 3.6°）
//   3) 均时差（1984-10-27 是第 301 天，闰年 366 天）:
//      B = 2π × (301 - 81) / 366 = 2π × 220/366 ≈ 3.7764 rad
//      EoT = 9.87×sin(2B) - 7.53×cos(B) - 1.5×sin(B)
//          = 9.87×0.9524 - 7.53×(-0.8090) - 1.5×(-0.5878)
//          ≈ 9.40 + 6.09 + 0.88 = 16.38 分钟
//   4) 总修正 = -14.335 + 16.379 = +2.045 分钟 ≈ +2m 3s
//      (经度差和均时差方向相反，几乎抵消)
//   5) 真太阳时 = 1984-10-27 10:02:02
//      → 日期不变，时辰仍在巳时 (09:00-11:00)
//
// 原四柱 (标准时间 1984-10-27 10:00):
//   - 年: 甲子（1984 甲子年）
//   - 月: 甲戌（寒露后立冬前，戌月。甲年戌月 = 甲戌）
//   - 日: 甲午（1984-10-27 日柱）
//   - 时: 己巳（10:00 巳时 09:00-11:00；甲日巳时 = 己巳）
//
// 换算后四柱 (真太阳时 1984-10-27 10:02):
//   - 四柱完全不变（仅偏移 2 分钟，不跨任何边界）
//
// 选择 10 月 27 日的原因:
//   10 月底均时差约 +16 分钟（极大值），与北京经度差 -14.3 分钟方向相反，
//   二者几乎完全抵消。这是"最佳抵消"案例 —— 即使加入真太阳时，
//   四柱结果也与不加入几乎完全一致。

describe('Test 3: Beijing — near-zero net offset, pillars unchanged', () => {
  it('1984-10-27 10:00 in Beijing → solar 1984-10-27 10:02, same pillars', () => {
    const result = calculateBazi(makeInput({
      year: 1984, month: 10, day: 27, hour: 10, minute: 0,
      birthPlace: {
        province: '北京市',
        city: '北京市',
        district: '东城区',
      },
    }));

    expect(result.solarTimeAdjustment).not.toBeNull();
    const adj = result.solarTimeAdjustment!;

    // 经度验证
    expect(adj.longitude).toBeCloseTo(116.42, 1);

    // 经度差: 约 -14.3 分钟
    expect(adj.longitudeOffsetMinutes).toBeLessThan(-14);
    expect(adj.longitudeOffsetMinutes).toBeGreaterThan(-15);

    // 均时差: 约 +16.4 分钟（10 月底极大值）
    expect(adj.equationOfTimeMinutes).toBeGreaterThan(15);
    expect(adj.equationOfTimeMinutes).toBeLessThan(17);

    // 总修正: 约 +2 分钟（经度差和均时差相互抵消）
    expect(adj.totalOffsetMinutes).toBeGreaterThan(1);
    expect(adj.totalOffsetMinutes).toBeLessThan(3);

    // 真太阳时仍在同一天同一时辰
    expect(adj.solarTime.getDate()).toBe(27);
    expect(adj.solarTime.getHours()).toBe(10);
    expect(adj.solarTime.getMinutes()).toBeGreaterThanOrEqual(1);
    expect(adj.solarTime.getMinutes()).toBeLessThanOrEqual(3);

    // 四柱应保持不变
    expect(result.pillars.year.stem).toBe('甲');
    expect(result.pillars.year.branch).toBe('子');
    expect(result.pillars.month.stem).toBe('甲');
    expect(result.pillars.month.branch).toBe('戌');
    expect(result.pillars.day.stem).toBe('甲');
    expect(result.pillars.day.branch).toBe('午');
    expect(result.pillars.hour.stem).toBe('己');
    expect(result.pillars.hour.branch).toBe('巳');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 测试 4: 不完整 birthPlace 走兜底路径
// ═══════════════════════════════════════════════════════════════════════════════
//
// 目的: 验证当 birthPlace 只填了省份但城市为空时，
// 代码走兜底路径（跳过真太阳时换算），行为与不传 birthPlace 完全一致。
//
// 原始输入:
//   1990-06-15 14:30 北京时间
//   birthPlace: { province: '北京市', city: '', district: '' }
//   （只有省份，城市为空 —— 三级不全）
//
// 推导链:
//   1) input.birthPlace 存在，但 city === ''
//   2) 条件 input.birthPlace?.province && input.birthPlace?.city
//      检查 province 非空（'北京市' truthy）AND city 非空（'' falsy）→ false
//   3) 跳过 adjustToSolarTime()，使用原始 createLunarFromInput() 路径
//   4) solarTimeAdjustment 设为 null
//   5) 四柱应与不传 birthPlace 时相同
//
// 回归保证: 这个测试确保空 city 不会导致异常的查找或报错。

describe('Test 4: Partial birthPlace — fallback to standard time', () => {
  it('province only with empty city → behaves as no birthPlace', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      birthPlace: {
        province: '北京市',
        city: '',
        district: '',
      },
    }));

    // solarTimeAdjustment 应为 null（city 为空，跳过换算）
    expect(result.solarTimeAdjustment).toBeNull();

    // 四柱应与不传 birthPlace 时完全一致（对比测试 1 / 原测试 9）
    expect(result.pillars.year.stem).toBe('庚');
    expect(result.pillars.year.branch).toBe('午');
    expect(result.pillars.month.stem).toBe('壬');
    expect(result.pillars.month.branch).toBe('午');
    expect(result.pillars.day.stem).toBe('辛');
    expect(result.pillars.day.branch).toBe('亥');
    expect(result.pillars.hour.stem).toBe('乙');
    expect(result.pillars.hour.branch).toBe('未');
  });

  // 这是对测试 4 的对称补充：验证 province 为空时也走跳过换算的兜底路径，
  // 与 city 为空场景对称。两者都使条件 input.birthPlace?.province &&
  // input.birthPlace?.city 为 falsy。
  it('empty province string → also skip solar time', () => {
    const result = calculateBazi(makeInput({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      birthPlace: {
        province: '',
        city: '',
        district: '',
      },
    }));

    // province 为空 → 跳过换算
    expect(result.solarTimeAdjustment).toBeNull();

    // 四柱不变
    expect(result.pillars.day.stem).toBe('辛');
    expect(result.pillars.day.branch).toBe('亥');
  });
});
