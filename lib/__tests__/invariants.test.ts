// ─────────────────────────────────────────────────────────────
// S7 全量回归:1901-2099 每月 1 日 × 3 时辰 × 男女 ≈1.4 万张命盘
// 不变量断言(诊断流程 L0-L10 环环相扣的最终验收线):
//  1. analyze() 无异常;
//  2. 喜用 ∩ 忌神 = ∅(喜忌规格书 2.6);
//  3. 判定轨迹非空;
//  4. 三段文案非空;
//  5. 文案气候论断 = 调候层判定(无虚假论断);
//  6. 化格/从格文案只论化/从;
//  7. 事业/体质/神煞结构完整。
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { calculateBazi } from '../bazi'
import { analyze } from '../bage/analyze'

describe('全量回归:1.4 万命盘不变量大扫(1901-2099)', () => {
  it('所有命盘满足全部不变量', { timeout: 300000 }, () => {
    let total = 0
    let failed = 0
    const failures: string[] = []

    for (let y = 1901; y <= 2099; y++) {
      for (let m = 1; m <= 12; m++) {
        for (const h of [0, 8, 16]) {
          for (const gender of ['male', 'female'] as const) {
            const bazi = calculateBazi({
              year: y, month: m, day: 1, hour: h, minute: 0, gender, isLunar: false,
            })
            total++
            try {
              const full = analyze(bazi)
              const problems: string[] = []

              // 1. 喜忌不相交
              const inter = full.xiYong.favorable.filter((el) => full.xiYong.avoid.includes(el))
              if (inter.length > 0) problems.push(`喜忌相交:[${inter.join('/')}]`)

              // 2. 判定轨迹非空
              if (full.pattern.judgementTrace.length === 0) problems.push('判定轨迹为空')

              // 3. 文案非空
              if (!full.texts.summary || !full.texts.analysis || !full.texts.narrative) {
                problems.push('文案缺失')
              }

              // 4. 文案气候论断 = 调候层判定
              if (full.texts.narrative.includes('火炎土燥') && full.tiaoHou.type !== '火炎土燥') {
                problems.push('叙事声称火炎土燥但调候层不一致')
              }
              if (full.texts.narrative.includes('金寒水冷') && full.tiaoHou.type !== '金寒水冷') {
                problems.push('叙事声称金寒水冷但调候层不一致')
              }

              // 5. 化格/从格只论化/从
              if (full.pattern.category.startsWith('化') && !full.texts.analysis.includes('只论化')) {
                problems.push('化格文案未体现只论化')
              }
              if (full.pattern.category.startsWith('从') && !full.texts.analysis.includes('只论从')) {
                problems.push('从格文案未体现只论从')
              }

              // 6. 结构完整
              if (full.texts.health.organs.length !== 5) problems.push('体质脏腑不足5个')
              if (full.texts.career.industries.length === 0 && full.xiYong.favorable.length > 0) {
                problems.push('有喜用但行业推荐为空')
              }

              // 7. 规则轨迹非空
              if (full.xiYong.ruleTrace.length === 0) problems.push('喜忌规则轨迹为空')

              if (problems.length > 0) {
                failed++
                if (failures.length < 10) {
                  const p = full.bazi.pillars
                  const gz = `${p.year.stem}${p.year.branch} ${p.month.stem}${p.month.branch} ${p.day.stem}${p.day.branch} ${p.hour.stem}${p.hour.branch}`
                  failures.push(`${y}-${m}-${1} ${h}时 ${gender} [${gz}] ${full.pattern.category}: ${problems.join('; ')}`)
                }
              }
            } catch (e) {
              failed++
              if (failures.length < 10) {
                failures.push(`${y}-${m}-${1} ${h}时 ${gender}: 异常 ${e}`)
              }
            }
          }
        }
      }
    }

    if (failures.length > 0) {
      console.log('不变量失败样例:\n' + failures.join('\n'))
    }
    expect(failed, `共扫 ${total} 盘,${failed} 盘违反不变量(样例见输出)`).toBe(0)
    expect(total).toBeGreaterThan(14000)
  })
})
