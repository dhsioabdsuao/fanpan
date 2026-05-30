import { describe, it, expect } from 'vitest'
import type { BaziResult } from '@/types/bazi'
import { getTenGod } from '@/lib/bazi-utils'
import { extractPattern } from './extractPattern'

function makeBazi(
  yearStem: string, yearBranch: string,
  monthStem: string, monthBranch: string,
  dayStem: string, dayBranch: string,
  hourStem: string, hourBranch: string,
): BaziResult {
  return {
    pillars: {
      year: { stem: yearStem, branch: yearBranch, stemElement: '木', branchElement: '水', hiddenStems: [] },
      month: { stem: monthStem, branch: monthBranch, stemElement: '木', branchElement: '土', hiddenStems: [] },
      day: { stem: dayStem, branch: dayBranch, stemElement: '土', branchElement: '土', hiddenStems: [] },
      hour: { stem: hourStem, branch: hourBranch, stemElement: '土', branchElement: '火', hiddenStems: [] },
    },
    dayMaster: dayStem,
    dayMasterElement: '土',
    zodiac: '',
    naYin: { year: '', month: '', day: '', hour: '' },
    elementCount: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 },
    tenGods: {
      yearStem: '', monthStem: '', hourStem: '',
      yearBranch: [], monthBranch: [], dayBranch: [], hourBranch: [],
    },
    solarDate: '',
    lunarDate: '',
    inputInfo: { year: 2000, month: 1, day: 1, hour: 0, minute: 0, gender: 'male', isLunar: false },
    solarTimeAdjustment: null,
  }
}

describe('extractPattern — 真实命局验证', () => {

  // ═══════════════════════════════════════════════════════════
  // 命局1：壬午 / 甲辰 / 戊午 / 己未
  // 日主戊(阳土)，月支辰
  // 辰藏：戊(本气) 乙(中气) 癸(余气)
  // 天干池 = {壬年, 甲月, 己时}（日干戊已排除）
  // 本气戊=比肩 → 禄刃月；中气乙/余气癸均不透 → 建禄格
  // ═══════════════════════════════════════════════════════════
  describe('命局1：建禄格（戊日主·辰月·全不透）', () => {
    const bazi = makeBazi(
      '壬', '午',  // 年
      '甲', '辰',  // 月（辰藏戊/乙/癸）
      '戊', '午',  // 日（戊=阳土）
      '己', '未',  // 时
    )

    it('辰月藏干确认：戊(本气)、乙(中气)、癸(余气)', () => {
      expect(getTenGod('戊', '戊')).toBe('比肩')
      expect(getTenGod('戊', '乙')).toBe('正官')
      expect(getTenGod('戊', '癸')).toBe('正财')
    })

    it('天干池={壬,甲,己}，乙/癸均不透 → 禄刃月无借透 → 建禄格', () => {
      const r = extractPattern(bazi)
      expect(r.patternName).toBe('建禄格')
      expect(r.patternGod).toBe('戊')
      expect(r.patternGodType).toBe('比肩')
      expect(r.patternOrigin).toBe('本气不透')
      expect(r.patternGodSource).toContain('立建禄格')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 命局2：甲申 / 甲戌 / 乙酉 / 辛巳
  // 日主乙(阴木)，月支=戌（甲戌→地支戌，NOT酉）
  // 戌藏：戊(本气) 辛(中气) 丁(余气)
  // 天干池 = {甲年, 甲月, 辛时}（日干乙已排除）
  // 本气戊=正财不透；中气辛透时干 → getTenGod(乙,辛)=七杀 → 七杀格
  //
  // [注] 用户标注“月支酉”，但四柱甲戌→月支=戌。
  // 戌中气辛透时干，结果仍为七杀格（经中气透而非本气透）。
  // ═══════════════════════════════════════════════════════════
  describe('命局2：七杀格（乙日主·戌月·中气辛透时干）', () => {
    const bazi = makeBazi(
      '甲', '申',  // 年
      '甲', '戌',  // 月（甲戌→月支=戌，藏戊/辛/丁）
      '乙', '酉',  // 日（乙=阴木）
      '辛', '巳',  // 时（辛透时干）
    )

    it('戌月藏干确认：戊(本气)=正财, 辛(中气)=七杀, 丁(余气)=食神', () => {
      expect(getTenGod('乙', '戊')).toBe('正财')
      expect(getTenGod('乙', '辛')).toBe('七杀')
      expect(getTenGod('乙', '丁')).toBe('食神')
    })

    it('本气戊不透，中气辛透时干 → 七杀格（透干）', () => {
      const r = extractPattern(bazi)
      expect(r.patternName).toBe('七杀格')
      expect(r.patternGod).toBe('辛')
      expect(r.patternGodType).toBe('七杀')
      expect(r.patternOrigin).toBe('透干')
      expect(r.patternGodSource).toBe('透于hour干')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 命局4：丁卯 / 己酉 / 丁亥 / 辛亥
  // 日主丁(阴火)，月支酉
  // 酉藏：辛(本气)
  // 天干池 = {丁年, 己月, 辛时}（日干丁已排除，年干丁是同名字符但不同柱，保留）
  // 辛透时干 → getTenGod(丁,辛)=偏财 → 偏财格
  // ═══════════════════════════════════════════════════════════
  describe('命局4：偏财格（丁日主·酉月）', () => {
    const bazi = makeBazi(
      '丁', '卯',  // 年（丁年干≠丁日干，不同柱，保留在天干池）
      '己', '酉',  // 月（酉藏辛本气）
      '丁', '亥',  // 日（丁=阴火）
      '辛', '巳',  // 时（辛透时干）
    )

    it('酉月藏干确认：辛(本气) → getTenGod(丁,辛)=偏财', () => {
      expect(getTenGod('丁', '辛')).toBe('偏财')
    })

    it('辛透时干 → 偏财格（透干）', () => {
      const r = extractPattern(bazi)
      expect(r.patternName).toBe('偏财格')
      expect(r.patternGod).toBe('辛')
      expect(r.patternGodType).toBe('偏财')
      expect(r.patternOrigin).toBe('透干')
      expect(r.patternGodSource).toBe('透于hour干')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 命局5：庚申 / 甲寅 / 丙午 / 庚申
  // 日主丙(阳火)，月支寅
  // 寅藏：甲(本气) 丙(中气) 戊(余气)
  // 天干池 = {庚年, 甲月, 庚时}（日干丙已排除）
  // 甲透月干 → getTenGod(丙,甲)=偏印 → 偏印格
  // ═══════════════════════════════════════════════════════════
  describe('命局5：偏印格（丙日主·寅月）', () => {
    const bazi = makeBazi(
      '庚', '申',  // 年
      '甲', '寅',  // 月（寅藏甲/丙/戊；甲透月干）
      '丙', '午',  // 日（丙=阳火）
      '庚', '申',  // 时
    )

    it('寅月藏干确认：甲(本气)=偏印, 丙(中气)=比肩, 戊(余气)=食神', () => {
      expect(getTenGod('丙', '甲')).toBe('偏印')
      expect(getTenGod('丙', '丙')).toBe('比肩')
      expect(getTenGod('丙', '戊')).toBe('食神')
    })

    it('本气甲透月干 → 偏印格（透干）', () => {
      const r = extractPattern(bazi)
      expect(r.patternName).toBe('偏印格')
      expect(r.patternGod).toBe('甲')
      expect(r.patternGodType).toBe('偏印')
      expect(r.patternOrigin).toBe('透干')
      expect(r.patternGodSource).toBe('透于month干')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 边界：透多个 → 本气优先
  // 月支寅藏甲(本气)/丙(中气)/戊(余气)
  // 年干丙、月干甲，甲和丙都透 → 应取本气甲（偏财），非中气丙（七杀）
  // 日主庚(阳金)可区分：甲→偏财, 丙→七杀
  // ═══════════════════════════════════════════════════════════
  describe('透多个：寅月·甲丙双透 → 本气甲优先', () => {
    const bazi = makeBazi(
      '丙', '寅',  // 年（丙透年干）
      '甲', '寅',  // 月（甲透月干；寅藏甲/丙/戊）
      '庚', '申',  // 日（庚=阳金）
      '壬', '午',  // 时
    )

    it('getTenGod：甲→偏财, 丙→七杀（可区分）', () => {
      expect(getTenGod('庚', '甲')).toBe('偏财')
      expect(getTenGod('庚', '丙')).toBe('七杀')
    })

    it('甲丙双透 → 本气甲优先 → 偏财格（非七杀格）', () => {
      const r = extractPattern(bazi)
      expect(r.patternName).toBe('偏财格')
      expect(r.patternGod).toBe('甲')
      expect(r.patternGodType).toBe('偏财')
      expect(r.patternOrigin).toBe('透干')
      expect(r.patternGodSource).toBe('透于month干')
    })
  })
})
