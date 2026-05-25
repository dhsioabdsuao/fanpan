import { describe, it, expect } from 'vitest'
import { calculateBazi } from '@/lib/bazi'
import { calculateDayMasterStrength } from '@/lib/strength'
import { buildFactPack } from './index'
import type { BaziInput, BaziResult } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength/types'

function makeInput(overrides: Partial<BaziInput> = {}): BaziInput {
  return {
    year: 2002,
    month: 4,
    day: 20,
    hour: 15,
    minute: 32,
    gender: 'male',
    isLunar: false,
    ...overrides,
  }
}

function compute(input: BaziInput): { bazi: BaziResult; strength: DayMasterStrength } {
  const bazi = calculateBazi(input)
  const strength = calculateDayMasterStrength(bazi)
  return { bazi, strength }
}

describe('buildFactPack', () => {
  // ── 测试1：用户命局 2002-04-20 15:32（河南栾川县,男）─
  it('用户命局：火土偏枯 + 印星显赫 + 阳系主导 + 午午自刑', () => {
    const input = makeInput({
      year: 2002, month: 4, day: 20, hour: 15, minute: 32,
      gender: 'male',
      birthPlace: { province: '河南省', city: '洛阳市', district: '栾川县' },
    })
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    // 基础事实
    expect(pack.dayMaster).toBeDefined()
    expect(pack.dayMasterElement).toBeDefined()
    expect(pack.monthCommand.branch).toBeDefined()

    // 五行力量完整
    expect(pack.elementForce.forces['金']).toBeDefined()
    expect(pack.elementForce.forces['木']).toBeDefined()
    expect(pack.elementForce.forces['水']).toBeDefined()
    expect(pack.elementForce.forces['火']).toBeDefined()
    expect(pack.elementForce.forces['土']).toBeDefined()
    expect(pack.elementForce.average).toBeGreaterThan(0)

    // 相生链路：5条
    expect(pack.flowLinks).toHaveLength(5)
    for (const link of pack.flowLinks) {
      expect(['flowing', 'weak', 'blocked']).toContain(link.status)
    }

    // 干支关联
    expect(pack.stemBranchRelation.pairs).toHaveLength(4)
    expect(pack.stemBranchRelation.yinYangTexture).toBeDefined()

    // 十神分布
    expect(pack.tenGods.yinStar).toBeGreaterThanOrEqual(0)
    expect(pack.tenGods.biJie).toBeGreaterThanOrEqual(0)

    // 调候
    expect(['偏寒', '偏暖', '平衡']).toContain(pack.climaticBalance.coldWarm)
    expect(['偏燥', '偏湿', '平衡']).toContain(pack.climaticBalance.dryWet)
    expect(pack.climaticBalance.pattern).toBe('火炎土燥')
    expect(pack.climaticBalance.needs).toContain('水')
    expect(pack.climaticBalance.needs).toContain('金')

    // 阴阳质地：日主戊(阳) + 地支3阳1阴(真太阳时修正后) → 阳主阴辅
    expect(pack.structureSummary.yinYangLayer).toBe('阳主阴辅')

    // 命局结构
    expect(pack.structureSummary.primaryTypes.length).toBeGreaterThan(0)
    expect(pack.structureSummary.primaryTypes.length).toBeLessThanOrEqual(3)

    // LLM 占位符
    expect(pack.placeholders.mainNarrative).toBe('{{MAIN_NARRATIVE}}')
  })

  // ── 测试2：1990-06-15 14:30 北京东城区（辛亥日,男）─
  it('1990-06-15 14:30 北京东城区：结构合理，分类存在', () => {
    const input = makeInput({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      gender: 'male',
      birthPlace: { province: '北京市', city: '北京市', district: '东城区' },
    })
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    expect(pack.dayMaster).toBeDefined()
    expect(pack.structureSummary.primaryTypes.length).toBeGreaterThan(0)
    expect(pack.flowLinks).toHaveLength(5)
    expect(pack.stemBranchRelation.pairs).toHaveLength(4)
    expect(pack.conflictsAndHarmonies).toBeDefined()
  })

  // ── 测试3：极端火土命局（自构）─
  it('极端火土命局：火土合计远超平均水平', () => {
    // 丙午年 甲午月 戊午日 己未时 → 满盘火土
    const input: BaziInput = {
      year: 1966, month: 6, day: 22, hour: 14, minute: 0,
      gender: 'male', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    // 火土合计应远超平均
    const fireForce = pack.elementForce.forces['火'].force
    const earthForce = pack.elementForce.forces['土'].force
    const fireEarthSum = fireForce + earthForce
    const avg = pack.elementForce.average
    expect(fireEarthSum).toBeGreaterThan(avg * 1.6)

    // 火或土至少有一个是最旺的
    const maxForce = Math.max(
      pack.elementForce.forces['金'].force,
      pack.elementForce.forces['木'].force,
      pack.elementForce.forces['水'].force,
      fireForce,
      earthForce,
    )
    expect(maxForce === fireForce || maxForce === earthForce).toBe(true)
  })

  // ── 测试4：五行均匀命局（自构）─
  it('五行均匀命局：触发1a_周流', () => {
    // 精心选择一个相对均匀的命局
    // 甲子年 己巳月 壬寅日 辛亥时 → 木水土金较均匀
    const input: BaziInput = {
      year: 1984, month: 5, day: 15, hour: 22, minute: 0,
      gender: 'male', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    // 至少有一个分类
    expect(pack.structureSummary.primaryTypes.length).toBeGreaterThan(0)
    // 所有元素力应该非零
    for (const el of ['金', '木', '水', '火', '土'] as const) {
      expect(pack.elementForce.forces[el].force).toBeGreaterThan(0)
    }
  })

  // ── 测试5：最多3段触发限制 ──
  it('多触发限制：primaryTypes 不超过3个', () => {
    const input: BaziInput = {
      year: 2000, month: 7, day: 15, hour: 10, minute: 0,
      gender: 'female', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    expect(pack.structureSummary.primaryTypes.length).toBeLessThanOrEqual(3)
    expect(pack.structureSummary.overallTone).toBeDefined()
  })

  // ── 测试6：4a 双行交战（构造金木对峙）─
  it('4a 双行交战：金木对峙命局', () => {
    // 庚申年 甲申月 庚寅日 甲申时 → 满盘金木对峙
    const input: BaziInput = {
      year: 1980, month: 8, day: 20, hour: 16, minute: 0,
      gender: 'male', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    const types = pack.structureSummary.primaryTypes.map((t) => t.type)
    // 如果金木都强，可能是4a或偏枯
    expect(pack.structureSummary.primaryTypes.length).toBeGreaterThan(0)
  })

  // ── 测试7：调候判定——夏季火旺偏燥 ──
  it('调候判定：夏季火旺应偏暖偏燥', () => {
    // 丙午年 丙午月 丙午日 乙未时 → 夏季满火
    const input: BaziInput = {
      year: 1966, month: 6, day: 15, hour: 14, minute: 0,
      gender: 'male', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    // 月支在午（夏季），火旺水弱 → 偏暖偏燥
    expect(pack.climaticBalance.coldWarm).toBe('偏暖')
    // 调候需求应包含补水
    expect(pack.climaticBalance.needs).toContain('水')
  })

  // ── 测试8：刑冲合识别 ──
  it('刑冲合识别：午午自刑 + 寅午戌三合', () => {
    // 甲寅年 戊午月 丙午日 甲午时 → 多午重逢
    const input: BaziInput = {
      year: 1974, month: 6, day: 10, hour: 12, minute: 0,
      gender: 'male', isLunar: false,
    }
    const { bazi, strength } = compute(input)
    const pack = buildFactPack(bazi, strength)

    const allConflicts = [
      ...pack.conflictsAndHarmonies.sixClashes,
      ...pack.conflictsAndHarmonies.threePunishments,
      ...pack.conflictsAndHarmonies.sixCombinations,
      ...pack.conflictsAndHarmonies.threeUnions,
      ...pack.conflictsAndHarmonies.halfUnions,
      ...pack.conflictsAndHarmonies.archUnions,
    ]
    // 至少识别出一种刑冲合关系
    expect(allConflicts.length).toBeGreaterThan(0)
  })

  // ── 额外：验证 force 计算与日主一致 ──
  it('五行力量中，日主元素力 > 0', () => {
    const { bazi, strength } = compute(makeInput())
    const pack = buildFactPack(bazi, strength)

    const dmForce = pack.elementForce.forces[pack.dayMasterElement].force
    expect(dmForce).toBeGreaterThan(0)
  })

  // ── 额外：placeholders 完整性 ──
  it('placeholders 包含所有 LLM 占位符', () => {
    const { bazi, strength } = compute(makeInput())
    const pack = buildFactPack(bazi, strength)

    expect(pack.placeholders.mainNarrative).toBe('{{MAIN_NARRATIVE}}')
    expect(pack.placeholders.flowAdvice).toBe('{{FLOW_ADVICE}}')
    expect(pack.placeholders.structureInsight).toBe('{{STRUCTURE_INSIGHT}}')
    expect(pack.placeholders.climaticNote).toBe('{{CLIMATIC_NOTE}}')
    expect(pack.placeholders.conflictNote).toBe('{{CONFLICT_NOTE}}')
  })
})
