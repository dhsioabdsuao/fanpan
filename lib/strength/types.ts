export type StrengthLevel = '极强' | '偏强' | '中和' | '偏弱' | '极弱'

export interface StrengthBreakdown {
  monthlyOrderScore: number
  branchRootsScore: number
  stemSupportScore: number
  stemDrainScore: number
  hiddenStemsScore: number
}

export interface StrengthDetail {
  factor: string
  source: string
  rawScore: number
  positionWeight: number
  conflictAdjust: number
  finalScore: number
}

export interface DayMasterStrength {
  totalScore: number
  level: StrengthLevel
  breakdown: StrengthBreakdown
  details: StrengthDetail[]
}

export type RootLevel = '本气根' | '中气根' | '余气根'

export type HiddenStemPosition = '本气' | '中气' | '余气'

export interface HiddenStemEntry {
  stem: string
  position: HiddenStemPosition
}
