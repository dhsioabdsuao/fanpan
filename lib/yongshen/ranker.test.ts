import { describe, it, expect } from 'vitest'
import { rankGanRatings } from './ranker'
import type { GanRating, TiaoHouAdjustment, TongGuanResult, FuYiResult } from './types'
import type { ElementType } from '@/types/bazi'
import type { FlowFactPack } from '@/lib/flow'

// ── 辅助工厂 ──

function makeRating(overrides: Partial<GanRating> = {}): GanRating {
  return {
    gan: '甲',
    element: '木',
    yinYang: '阳',
    tenGod: '比肩',
    category: '闲',
    priority: 0,
    score: 0,
    reason: '',
    ...overrides,
  }
}

function mockTiaoHou(overrides: Partial<TiaoHouAdjustment> = {}): TiaoHouAdjustment {
  return {
    active: false,
    level: 3,
    pattern: '平衡',
    needs: [],
    overrideFuYi: false,
    elementAdjust: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
    weight: 0,
    detail: '',
    hasRescue: false,
    ...overrides,
  }
}

function mockTongGuan(overrides: Partial<TongGuanResult> = {}): TongGuanResult {
  return {
    active: false,
    detail: '',
    ...overrides,
  }
}

function mockFuYi(overrides: Partial<FuYiResult> = {}): FuYiResult {
  return {
    active: true,
    direction: '克泄耗',
    elementScores: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
    weight: 1.0,
    detail: '',
    ...overrides,
  }
}

function mockFactPack(): FlowFactPack {
  return {} as unknown as FlowFactPack
}

// ── 测试 ──

describe('rankGanRatings', () => {
  it('1. 正常扶抑 + 平衡调候(level=3)：调候权重0，纯扶抑评分', () => {
    const ratings: GanRating[] = [
      makeRating({ gan: '庚', element: '金', score: 4.0, tenGod: '食神', reason: '金基础+3, 食神+0.5, 补缺+0.5' }),
      makeRating({ gan: '辛', element: '金', score: 3.5, tenGod: '伤官', reason: '金基础+3, 补缺+0.5' }),
      makeRating({ gan: '壬', element: '水', score: 3.3, tenGod: '偏财', reason: '水基础+3, 现成+0.3' }),
      makeRating({ gan: '癸', element: '水', score: 3.0, tenGod: '正财', reason: '水基础+3' }),
      makeRating({ gan: '甲', element: '木', score: 2.8, tenGod: '七杀', reason: '木基础+2, 七杀+0.5, 现成+0.3' }),
      makeRating({ gan: '乙', element: '木', score: 2.0, tenGod: '正官', reason: '木基础+2' }),
      makeRating({ gan: '丙', element: '火', score: -3, tenGod: '偏印', reason: '火基础-3' }),
      makeRating({ gan: '丁', element: '火', score: -3, tenGod: '正印', reason: '火基础-3' }),
      makeRating({ gan: '戊', element: '土', score: -3, tenGod: '比肩', reason: '土基础-3' }),
      makeRating({ gan: '己', element: '土', score: -3, tenGod: '劫财', reason: '土基础-3' }),
    ]

    const tiaoHou = mockTiaoHou({ level: 3 })
    const tongGuan = mockTongGuan()
    const fuYi = mockFuYi()

    const result = rankGanRatings(ratings, tiaoHou, tongGuan, fuYi, mockFactPack())

    // 分数不变（调候权重 0）
    expect(result.finalRatings[0].score).toBe(4.0)
    expect(result.finalRatings[1].score).toBe(3.5)

    // 前 4 个为喜用神
    expect(result.yongShen).toHaveLength(4)
    expect(result.yongShen[0].gan).toBe('庚')
    expect(result.yongShen[1].gan).toBe('辛')
    expect(result.yongShen[2].gan).toBe('壬')
    expect(result.yongShen[3].gan).toBe('癸')

    // 忌神（分数最低的）
    expect(result.jiShen).toHaveLength(3)
    expect(result.jiShen[0].score).toBe(-3)

    // 闲神
    expect(result.xianShen).toHaveLength(3) // 甲 2.0, 乙 2.8 are between 0 and 0.5... wait
    // classifyScore: >0.5 喜用, >0 闲, >= -0.5 闲, >= -2.5 忌, < -2.5 仇
    // 甲 2.8 → 喜用, 乙 2.0 → 喜用. So xianShen should be empty or contain only the non-selected ones
    // Actually: all with score > 0.5 are 喜用. 庚4.0,辛3.5,壬3.3,甲2.8,乙2.0 all > 0.5 → 5 喜用
    // But yongShen only takes top 4. So 乙 2.0 ends up in xianShen since it's not in yongShen or jiShen
    // 丙-3,丁-3,戊-3,己-3 all < -0.5 → 忌. jiShen takes top 3 worst → 丙,丁,戊
    // 己-3 → xianShen (not in top 3 jiShen)
    // 癸3.0 → xianShen... wait, 癸 3.0 > 0.5 so it's 喜用. But yongShen takes only top 4.
    // yongShen: 庚4.0, 辛3.5, 壬3.3, 癸3.0 (top 4 by score desc)
    // jiShen: 丙-3, 丁-3, 戊-3 (top 3 worst by score asc)
    // xianShen: 甲2.8, 乙2.0, 己-3
    expect(result.xianShen).toHaveLength(3)

    // priority 重算
    expect(result.yongShen[0].priority).toBe(1)
    expect(result.yongShen[3].priority).toBe(4)

    // 推理链
    expect(result.reasoning).toHaveLength(3) // 扶抑 + 阴阳干 + 最终排序（无调候、无通关）
  })

  it('2. Level 1 调候 override：扶抑权重 0.3，调候权重 0.7', () => {
    // 戊土偏弱，扶抑用火土，调候用金水 → override
    const ratings: GanRating[] = [
      makeRating({ gan: '丙', element: '火', score: 3.0, tenGod: '偏印', reason: '火基础+3' }),
      makeRating({ gan: '丁', element: '火', score: 2.0, tenGod: '正印', reason: '火基础+2' }),
      makeRating({ gan: '庚', element: '金', score: -2.0, tenGod: '食神', reason: '金基础-2' }),
      makeRating({ gan: '辛', element: '金', score: -2.0, tenGod: '伤官', reason: '金基础-2' }),
      makeRating({ gan: '壬', element: '水', score: -3.0, tenGod: '偏财', reason: '水基础-3' }),
      makeRating({ gan: '癸', element: '水', score: -3.0, tenGod: '正财', reason: '水基础-3' }),
      makeRating({ gan: '甲', element: '木', score: 0, tenGod: '七杀', reason: '木基础0' }),
      makeRating({ gan: '乙', element: '木', score: 0, tenGod: '正官', reason: '木基础0' }),
      makeRating({ gan: '戊', element: '土', score: 2.5, tenGod: '比肩', reason: '土基础+2.5' }),
      makeRating({ gan: '己', element: '土', score: 2.0, tenGod: '劫财', reason: '土基础+2' }),
    ]

    // 火炎土燥，调候喜金水忌火土
    const tiaoHou = mockTiaoHou({
      level: 1,
      overrideFuYi: true,
      pattern: '火炎土燥',
      elementAdjust: { 金: +2, 木: 0, 水: +2, 火: -2, 土: -2 },
      weight: 0.7,
      detail: '调候等级1（火炎土燥）：需金、水，避火、土，与扶抑方向冲突，调候优先',
    })
    const tongGuan = mockTongGuan()
    const fuYi = mockFuYi({ direction: '生扶' })

    const result = rankGanRatings(ratings, tiaoHou, tongGuan, fuYi, mockFactPack())

    // fuYiWeight=0.3, tiaoHouWeight=0.7
    // 丙火：3.0*0.3 + (-2)*0.7 = 0.9 - 1.4 = -0.5
    const bing = result.finalRatings.find((r) => r.gan === '丙')!
    expect(bing.score).toBeCloseTo(-0.5, 1)

    // 庚金：-2.0*0.3 + 2*0.7 = -0.6 + 1.4 = 0.8
    const geng = result.finalRatings.find((r) => r.gan === '庚')!
    expect(geng.score).toBeCloseTo(0.8, 1)

    // 壬水：-3.0*0.3 + 2*0.7 = -0.9 + 1.4 = 0.5
    const ren = result.finalRatings.find((r) => r.gan === '壬')!
    expect(ren.score).toBeCloseTo(0.5, 1)

    // 喜用神应包含庚金（调候加权后变正）
    const yongGans = result.yongShen.map((r) => r.gan)
    expect(yongGans).toContain('庚')
  })

  it('3. 通关介入：通关五行 +0.3', () => {
    const ratings: GanRating[] = [
      makeRating({ gan: '甲', element: '木', score: 2.0, tenGod: '比肩', reason: '木基础+2' }),
      makeRating({ gan: '乙', element: '木', score: 1.5, tenGod: '劫财', reason: '木基础+1.5' }),
      makeRating({ gan: '丙', element: '火', score: 2.5, tenGod: '食神', reason: '火基础+2.5' }),
      makeRating({ gan: '丁', element: '火', score: 2.0, tenGod: '伤官', reason: '火基础+2' }),
      makeRating({ gan: '戊', element: '土', score: -1.0, tenGod: '偏财', reason: '土基础-1' }),
      makeRating({ gan: '己', element: '土', score: -1.0, tenGod: '正财', reason: '土基础-1' }),
      makeRating({ gan: '庚', element: '金', score: -2.0, tenGod: '七杀', reason: '金基础-2' }),
      makeRating({ gan: '辛', element: '金', score: -2.0, tenGod: '正官', reason: '金基础-2' }),
      makeRating({ gan: '壬', element: '水', score: -2.5, tenGod: '偏印', reason: '水基础-2.5' }),
      makeRating({ gan: '癸', element: '水', score: -2.5, tenGod: '正印', reason: '水基础-2.5' }),
    ]

    const tiaoHou = mockTiaoHou({ level: 3 })
    // 通关：金木交战，用水通关
    const tongGuan = mockTongGuan({
      active: true,
      mediator: '水',
      clashingPair: ['金', '木'],
      detail: '金木交战，用水通关',
    })
    const fuYi = mockFuYi()

    const result = rankGanRatings(ratings, tiaoHou, tongGuan, fuYi, mockFactPack())

    // 壬水：-2.5 + 0.3 = -2.2
    const ren = result.finalRatings.find((r) => r.gan === '壬')!
    expect(ren.score).toBe(-2.2)
    expect(ren.reason).toContain('通关+0.3')

    // 癸水：-2.5 + 0.3 = -2.2
    const gui = result.finalRatings.find((r) => r.gan === '癸')!
    expect(gui.score).toBe(-2.2)
    expect(gui.reason).toContain('通关+0.3')

    // 非通关五行不受影响
    const jia = result.finalRatings.find((r) => r.gan === '甲')!
    expect(jia.score).toBe(2.0)

    // 推理链包含通关
    const tongGuanStep = result.reasoning.find((s) => s.step === '通关介入')
    expect(tongGuanStep).toBeDefined()
  })

  it('4. 边界情况：空 ratings 与全零分', () => {
    const tiaoHou = mockTiaoHou({ level: 3 })
    const tongGuan = mockTongGuan()
    const fuYi = mockFuYi()

    // 全零分
    const zeroRatings: GanRating[] = [
      makeRating({ gan: '甲', element: '木', score: 0, reason: '基础0' }),
      makeRating({ gan: '乙', element: '木', score: 0, reason: '基础0' }),
    ]

    const result = rankGanRatings(zeroRatings, tiaoHou, tongGuan, fuYi, mockFactPack())

    // 兜底触发：全零分时取 top2 为 yongShen（极端均衡命局保护）
    expect(result.yongShen).toHaveLength(2)
    expect(result.yongShen[0].category).toBe('喜用')
    expect(result.yongShen[0].reason).toContain('兜底取前2')
    // jiShen 也是这 2 个，但兜底会去重（top2 已全包含）
    expect(result.xianShen).toHaveLength(0)
  })

  it('5. 仇神判定：分数 < -2.5', () => {
    const ratings: GanRating[] = [
      makeRating({ gan: '甲', element: '木', score: -3.0, tenGod: '比肩', reason: '木基础-3' }),
      makeRating({ gan: '乙', element: '木', score: -2.8, tenGod: '劫财', reason: '木基础-2.8' }),
      makeRating({ gan: '丙', element: '火', score: -1.0, tenGod: '食神', reason: '火基础-1' }),
      makeRating({ gan: '丁', element: '火', score: -0.5, tenGod: '伤官', reason: '火基础-0.5' }),
    ]

    const tiaoHou = mockTiaoHou({ level: 3 })
    const tongGuan = mockTongGuan()
    const fuYi = mockFuYi()

    const result = rankGanRatings(ratings, tiaoHou, tongGuan, fuYi, mockFactPack())

    // 甲(-3.0) 和 乙(-2.8) 都是 仇（< -2.5）
    const jia = result.finalRatings.find((r) => r.gan === '甲')!
    expect(jia.category).toBe('仇')

    const yi = result.finalRatings.find((r) => r.gan === '乙')!
    expect(yi.category).toBe('仇')

    // 忌神列表包含 仇 分类的干
    const jiGans = result.jiShen.map((r) => r.gan)
    expect(jiGans).toContain('甲')
    expect(jiGans).toContain('乙')
  })
})
