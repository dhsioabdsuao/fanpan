// ─────────────────────────────────────────────────────────────
// 金标准命例库
//
// 来源两档:
//   source: 'user-confirmed' — 用户人工核对确认的命例(最高权威);
//   source: 'classical-text' — 古籍例题(子平真诠/穷通宝鉴等),待用户核对前为 draft;
//   source: 'draft'          — 待确认,测试自动跳过。
// 每个命例的 expected 是"最终应当判定为什么"——不是"当前代码判什么"。
// 当前代码与 expected 不一致时,测试红灯,提示该例尚未修复到位。
// ─────────────────────────────────────────────────────────────

import type { ElementType } from '@/types/bazi'

export interface GoldenXiYong {
  /** 喜用五行,有序(第一为最喜)——S4 computeXiYong 的最终预期 */
  favorable: ElementType[]
  /** 忌神五行 */
  avoid: ElementType[]
  /** 预期冲突说明要点(子串) */
  conflictNoteContains?: string
}

export interface GoldenCase {
  id: string
  source: 'user-confirmed' | 'classical-text' | 'draft'
  label: string
  pillars: [string, string, string, string] // 年 月 日 时
  gender: 'male' | 'female'
  expected: {
    elementCount: Record<ElementType, number>
    patternCategory: string
    outcome: '成格' | '不成格' | '破格'
    strengthLevel: '身强' | '中和' | '身弱'
    tiaoHouType: '火炎土燥' | '金寒水冷' | '寒暖适中'
    tiaoHouGods: string[]
    liuTongBlockage?: string
    liuTongTongGuan?: string
    /** S4 喜忌统一后激活 */
    xiYong?: GoldenXiYong
  }
}

export const GOLDEN_CASES: GoldenCase[] = [
  {
    // 用户本人命盘,2026-08-29 人工核对确认(含新流程喜忌预演)
    id: 'user-001',
    source: 'user-confirmed',
    label: '建禄月劫格·身强土厚·火炎土燥(壬午 甲辰 戊午 己未)',
    pillars: ['壬午', '甲辰', '戊午', '己未'],
    gender: 'male',
    expected: {
      elementCount: { 金: 0, 木: 1, 水: 1, 火: 2, 土: 4 },
      patternCategory: '建禄月劫格',
      outcome: '成格',
      strengthLevel: '身强',
      tiaoHouType: '火炎土燥',
      tiaoHouGods: ['甲', '丙', '癸'],
      liuTongBlockage: '土',
      liuTongTongGuan: '金',
      xiYong: {
        favorable: ['水', '木', '金'],
        avoid: ['土', '火'],
        conflictNoteContains: '火候已足',
      },
    },
  },
]
