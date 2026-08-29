// ─────────────────────────────────────────────────────────────
// S6 组件冒烟测试:所有结果页卡片从统一 full 渲染,不崩溃、关键标签在位
// 统一管线保证:analyze() 在测试中只调用一次,full 直接传入各卡片
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { buildChartFromPillars } from '@/lib/__tests__/testChart'
import { analyze } from '@/lib/bage/analyze'
import { PillarTable } from '@/components/bazi/PillarTable'
import { BasicInfo } from '@/components/bazi/BasicInfo'
import { ElementChart } from '@/components/bazi/ElementChart'
import { PatternBlock } from '@/components/bazi/PatternBlock'
import { StrengthBlock } from '@/components/bazi/StrengthBlock'
import { AnalysisBlock } from '@/components/bazi/AnalysisBlock'
import { TiaoHouBlock } from '@/components/bazi/TiaoHouBlock'
import { CareerGuidanceBlock } from '@/components/bazi/CareerGuidanceBlock'
import { HealthGuidanceBlock } from '@/components/bazi/HealthGuidanceBlock'
import { XiYongBlock } from '@/components/bazi/XiYongBlock'
import { LiuTongBlock } from '@/components/bazi/LiuTongBlock'
import { ShenShaBlock } from '@/components/bazi/ShenShaBlock'

// 用户确认命盘:建禄月劫·火炎土燥
const full = analyze(buildChartFromPillars({ pillars: ['壬午', '甲辰', '戊午', '己未'] }))

describe('结果页卡片冒烟(user-001)', () => {
  it('PillarTable:四柱干支在位', () => {
    render(<PillarTable full={full} />)
    const hasText = (t: string) => screen.getAllByText((_, el) => el?.textContent?.includes(t) ?? false)
    expect(hasText('壬午').length).toBeGreaterThan(0)
    expect(hasText('甲辰').length).toBeGreaterThan(0)
    expect(hasText('戊午').length).toBeGreaterThan(0)
    expect(hasText('己未').length).toBeGreaterThan(0)
  })

  it('BasicInfo + ElementChart:日主与五行分布渲染', () => {
    render(<BasicInfo full={full} />)
    expect(screen.getByText(/戊/)).toBeTruthy()
    render(<ElementChart full={full} />)
    expect(screen.getAllByText(/土/).length).toBeGreaterThan(0)
  })

  it('PatternBlock:格局名+判定依据轨迹', () => {
    render(<PatternBlock full={full} />)
    const hasText = (t: string) => screen.getAllByText((_, el) => el?.textContent?.includes(t) ?? false)
    expect(hasText('建禄月劫格').length).toBeGreaterThan(0)
    expect(hasText('判定依据').length).toBeGreaterThan(0)
  })

  it('StrengthBlock:身强', () => {
    render(<StrengthBlock full={full} />)
    expect(screen.getByText('身强')).toBeTruthy()
  })

  it('AnalysisBlock:总结+叙事+解析三段', () => {
    render(<AnalysisBlock full={full} />)
    expect(screen.getByText('命局叙事')).toBeTruthy()
    expect(screen.getByText(/发展建议/)).toBeTruthy()
  })

  it('TiaoHouBlock:气候徽章+调候神+冲突标注', () => {
    render(<TiaoHouBlock full={full} />)
    expect(screen.getByText(/命局偏燥/)).toBeTruthy()
    expect(screen.getByText(/火候已足/)).toBeTruthy()
  })

  it('XiYongBlock:喜用 水>木>金 + 忌神 土火', () => {
    render(<XiYongBlock full={full} />)
    const hasText = (t: string) => screen.getAllByText((_, el) => el?.textContent?.includes(t) ?? false)
    expect(hasText('喜用五行').length).toBeGreaterThan(0)
    expect(hasText('忌神').length).toBeGreaterThan(0)
    expect(hasText('判定依据').length).toBeGreaterThan(0)
    expect(hasText('最喜').length).toBeGreaterThan(0)
  })

  it('LiuTongBlock:淤堵与通关', () => {
    render(<LiuTongBlock full={full} />)
    expect(screen.getByText(/五行源头/)).toBeTruthy()
    expect(screen.getByText(/通关元素/)).toBeTruthy()
  })

  it('CareerGuidanceBlock:首选行业=水(第一优先)', () => {
    render(<CareerGuidanceBlock full={full} />)
    expect(screen.getByText(/第一优先/)).toBeTruthy()
    expect(screen.getByText(/注意：调候表含火/)).toBeTruthy()
  })

  it('HealthGuidanceBlock:偏燥综述+脏腑状态', () => {
    render(<HealthGuidanceBlock full={full} />)
    const hasText = (t: string) => screen.getAllByText((_, el) => el?.textContent?.includes(t) ?? false)
    expect(hasText('清热养阴').length).toBeGreaterThan(0)
    expect(hasText('脾胃').length).toBeGreaterThan(0)
  })

  it('ShenShaBlock:神煞分组展示+不参与判定说明', () => {
    render(<ShenShaBlock full={full} />)
    expect(screen.getByText(/贵人星/)).toBeTruthy()
    expect(screen.getByText(/不参与格局、强弱、喜忌判定/)).toBeTruthy()
  })
})
