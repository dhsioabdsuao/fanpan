import type { BirthPlace, SolarTimeAdjustment } from '@/lib/solarTime/types'

export type BaziInput = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: 'male' | 'female'
  isLunar: boolean
  isLeapMonth?: boolean
  birthPlace?: BirthPlace
}

export type ElementType = '金' | '木' | '水' | '火' | '土'

export type TenGodName =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印'

export type Pillar = {
  stem: string
  branch: string
  stemElement: ElementType
  branchElement: ElementType
  hiddenStems: string[]
}

export type BaziResult = {
  pillars: {
    year: Pillar
    month: Pillar
    day: Pillar
    hour: Pillar
  }
  dayMaster: string
  dayMasterElement: ElementType
  zodiac: string
  naYin: {
    year: string
    month: string
    day: string
    hour: string
  }
  elementCount: Record<ElementType, number>
  tenGods: {
    yearStem: string
    monthStem: string
    hourStem: string
    yearBranch: string[]
    monthBranch: string[]
    dayBranch: string[]
    hourBranch: string[]
  }
  solarDate: string
  lunarDate: string
  inputInfo: BaziInput
  solarTimeAdjustment: SolarTimeAdjustment | null
}
