import type { RootLevel, HiddenStemEntry } from './types'
import type { ElementType } from '@/types/bazi'
import { getStemElement } from '@/lib/bazi-utils'

const ELEMENT_GENERATES: Record<ElementType, ElementType> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const ELEMENT_CONTROLS: Record<ElementType, ElementType> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

export function elementGenerates(element: ElementType): ElementType {
  return ELEMENT_GENERATES[element]
}

export function elementIsGeneratedBy(element: ElementType): ElementType {
  for (const [gen, prod] of Object.entries(ELEMENT_GENERATES)) {
    if (prod === element) return gen as ElementType
  }
  throw new Error(`No generator for ${element}`)
}

export function elementControls(element: ElementType): ElementType {
  return ELEMENT_CONTROLS[element]
}

export function elementIsControlledBy(element: ElementType): ElementType {
  for (const [ctrl, victim] of Object.entries(ELEMENT_CONTROLS)) {
    if (victim === element) return ctrl as ElementType
  }
  throw new Error(`No controller for ${element}`)
}

export function doesStemControl(controller: string, target: string): boolean {
  return elementControls(getStemElement(controller)) === getStemElement(target)
}

const SIX_CLASHES: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const SIX_COMBINATIONS: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const clashMap = new Map<string, string>()
for (const [a, b] of SIX_CLASHES) {
  clashMap.set(a, b)
  clashMap.set(b, a)
}

const combineMap = new Map<string, string>()
for (const [a, b] of SIX_COMBINATIONS) {
  combineMap.set(a, b)
  combineMap.set(b, a)
}

export function isClashed(branch: string, allBranches: string[]): boolean {
  const opponent = clashMap.get(branch)
  if (!opponent) return false
  return allBranches.includes(opponent)
}

export function isCombined(branch: string, allBranches: string[]): boolean {
  const partner = combineMap.get(branch)
  if (!partner) return false
  return allBranches.includes(partner)
}

export function getConflictAdjust(branch: string, allBranches: string[]): number {
  if (isClashed(branch, allBranches)) return 0.5
  if (isCombined(branch, allBranches)) return 0.8
  return 1.0
}

export const BRANCH_POSITION_WEIGHTS: Record<string, number> = {
  year: 0.6, month: 1.0, day: 0.9, hour: 0.7,
}

export const STEM_POSITION_WEIGHTS: Record<string, number> = {
  year: 0.6, month: 1.0, hour: 0.8,
}

export const BRANCH_HIDDEN_STEMS: Record<string, HiddenStemEntry[]> = {
  子: [{ stem: '癸', position: '本气' }],
  丑: [{ stem: '己', position: '本气' }, { stem: '癸', position: '中气' }, { stem: '辛', position: '余气' }],
  寅: [{ stem: '甲', position: '本气' }, { stem: '丙', position: '中气' }, { stem: '戊', position: '余气' }],
  卯: [{ stem: '乙', position: '本气' }],
  辰: [{ stem: '戊', position: '本气' }, { stem: '乙', position: '中气' }, { stem: '癸', position: '余气' }],
  巳: [{ stem: '丙', position: '本气' }, { stem: '庚', position: '中气' }, { stem: '戊', position: '余气' }],
  午: [{ stem: '丁', position: '本气' }, { stem: '己', position: '中气' }],
  未: [{ stem: '己', position: '本气' }, { stem: '丁', position: '中气' }, { stem: '乙', position: '余气' }],
  申: [{ stem: '庚', position: '本气' }, { stem: '壬', position: '中气' }, { stem: '戊', position: '余气' }],
  酉: [{ stem: '辛', position: '本气' }],
  戌: [{ stem: '戊', position: '本气' }, { stem: '辛', position: '中气' }, { stem: '丁', position: '余气' }],
  亥: [{ stem: '壬', position: '本气' }, { stem: '甲', position: '中气' }],
}

const ROOT_BASE_SCORES: Record<RootLevel, number> = {
  本气根: 8, 中气根: 5, 余气根: 3,
}

export function getRootBaseScore(level: RootLevel): number {
  return ROOT_BASE_SCORES[level]
}

const HIDDEN_STEM_BASE_SCORES: Record<string, number> = {
  本气: 1.5, 中气: 1, 余气: 0.5,
}

export function getHiddenStemBaseScore(position: string): number {
  return HIDDEN_STEM_BASE_SCORES[position] ?? 0
}

export const ROOT_TABLE: Record<string, Record<string, Record<string, RootLevel>>> = {
  甲: { 寅: { 甲: '本气根' }, 卯: { 乙: '本气根' }, 亥: { 甲: '中气根' }, 未: { 乙: '中气根' }, 辰: { 乙: '余气根' } },
  乙: { 寅: { 甲: '本气根' }, 卯: { 乙: '本气根' }, 亥: { 甲: '中气根' }, 未: { 乙: '中气根' }, 辰: { 乙: '余气根' } },
  丙: { 巳: { 丙: '本气根' }, 午: { 丁: '本气根' }, 寅: { 丙: '中气根' }, 戌: { 丁: '中气根' }, 未: { 丁: '余气根' } },
  丁: { 巳: { 丙: '本气根' }, 午: { 丁: '本气根' }, 寅: { 丙: '中气根' }, 戌: { 丁: '中气根' }, 未: { 丁: '余气根' } },
  戊: {
    辰: { 戊: '本气根', 己: '本气根' }, 戌: { 戊: '本气根', 己: '本气根' },
    丑: { 戊: '本气根', 己: '本气根' }, 未: { 戊: '本气根', 己: '本气根' },
    寅: { 戊: '中气根' }, 巳: { 戊: '中气根' }, 申: { 戊: '中气根' },
  },
  己: {
    辰: { 戊: '本气根', 己: '本气根' }, 戌: { 戊: '本气根', 己: '本气根' },
    丑: { 戊: '本气根', 己: '本气根' }, 未: { 戊: '本气根', 己: '本气根' },
    午: { 己: '中气根' },
  },
  庚: { 申: { 庚: '本气根' }, 酉: { 辛: '本气根' }, 巳: { 庚: '中气根' }, 丑: { 辛: '中气根' }, 戌: { 辛: '余气根' } },
  辛: { 申: { 庚: '本气根' }, 酉: { 辛: '本气根' }, 巳: { 庚: '中气根' }, 丑: { 辛: '中气根' }, 戌: { 辛: '余气根' } },
  壬: { 亥: { 壬: '本气根' }, 子: { 癸: '本气根' }, 申: { 壬: '中气根' }, 辰: { 癸: '中气根' }, 丑: { 癸: '余气根' } },
  癸: { 亥: { 壬: '本气根' }, 子: { 癸: '本气根' }, 申: { 壬: '中气根' }, 辰: { 癸: '中气根' }, 丑: { 癸: '余气根' } },
}

export function isRoot(dayMaster: string, branch: string, hiddenStem: string): RootLevel | null {
  return ROOT_TABLE[dayMaster]?.[branch]?.[hiddenStem] ?? null
}
