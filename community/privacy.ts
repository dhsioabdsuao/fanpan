// ─────────────────────────────────────────────────────────────
// 脱敏选择器:FullAnalysis → PostDraft
//
// 隐私红线(唯一脱敏出口,所有发布必须经此):
//   云上只存四柱 + 性别 + 衍生摘要(格局/强弱/喜忌/神煞/大运摘要)。
//   精确出生分钟、姓名、出生地点、原始 birthParams【永不入云】。
//   PostDraft 类型上不含这些字段 —— 传参即脱敏,由构造保证。
// 发布请求体还会过 PostDraftSchema(zod 白名单 strip),双保险。
// ─────────────────────────────────────────────────────────────

import type { FullAnalysis } from '@/lib/bage/analyze'
import type { PillarData, PostDraft } from './types'

function pillarData(
  full: FullAnalysis,
  key: 'year' | 'month' | 'day' | 'hour',
): PillarData {
  const pillar = full.bazi.pillars[key]
  const tenGod =
    key === 'year'
      ? full.bazi.tenGods.yearStem
      : key === 'month'
        ? full.bazi.tenGods.monthStem
        : key === 'hour'
          ? full.bazi.tenGods.hourStem
          : null // 日柱为日主自身,无十神
  return {
    stem: pillar.stem,
    branch: pillar.branch,
    stemElement: pillar.stemElement,
    branchElement: pillar.branchElement,
    hiddenStems: pillar.hiddenStems,
    tenGod,
    naYin: full.bazi.naYin[key],
  }
}

/** 取成败结论 reason 的首句作帖子摘要(不解析该字段做任何判断) */
function patternSummary(full: FullAnalysis): string {
  const first = full.outcome.reason.split(/[。；;]/)[0]
  return first || full.outcome.reason
}

/** 四柱串,如「庚辰 壬午 甲辰 庚午」 */
function baziBrief(full: FullAnalysis): string {
  const { year, month, day, hour } = full.bazi.pillars
  return [year, month, day, hour].map((p) => p.stem + p.branch).join(' ')
}

/**
 * 把 FullAnalysis 裁成云上可存的脱敏草稿。
 * 返回对象的字段集 = PostDraft 白名单,由测试断言全集,
 * 防止将来字段漂移把出生原始数据带进去。
 */
export function buildPostDraft(full: FullAnalysis): PostDraft {
  return {
    gender: full.bazi.inputInfo.gender,
    baziBrief: baziBrief(full),
    pillars: {
      year: pillarData(full, 'year'),
      month: pillarData(full, 'month'),
      day: pillarData(full, 'day'),
      hour: pillarData(full, 'hour'),
    },
    dayMaster: full.bazi.dayMaster,
    dayMasterElement: full.bazi.dayMasterElement,
    pattern: {
      displayName: full.pattern.displayName,
      outcome: full.outcome.outcome,
      summary: patternSummary(full),
    },
    strength: { level: full.strength.level },
    xiYong: {
      favorable: full.xiYong.favorable,
      avoid: full.xiYong.avoid,
      yongShenTenGod: full.xiYong.yongShenTenGod,
    },
    shensha: full.shenSha.map((s) => ({ name: s.name, pillar: s.pillar })),
    daYun: full.bazi.daYun
      ? {
          startSolar: full.bazi.daYun.startSolar,
          isForward: full.bazi.daYun.isForward,
          decades: full.bazi.daYun.decades.map((d) => ({
            startYear: d.startYear,
            startAge: d.startAge,
            ganZhi: d.ganZhi,
          })),
        }
      : null,
  }
}
