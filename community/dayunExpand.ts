// ─────────────────────────────────────────────────────────────
// 大运流年展开(纯函数):从 PostDraft 产出 DaYunTable 所需数据
//
// 云上 DaYunSummary 只有每十年 {startYear, startAge, ganZhi},
// 这里按 60 甲子本地推导补全:起止年份/虚岁、旬空、每十年 10 个
// 流年及其与四柱/大运的特殊关系注解 —— 不改 PostDraft 白名单、
// 不新增云端字段,历史帖子同样生效。产出的 DaYunTableData 与
// 结果页 DaYunTable(FullAnalysis 经 toDaYunTableData 映射)同构,
// 两处渲染同一个组件。
//
// 已知边界:年干支以立春为界,公历年初(立春前)数日按上一年
// 干支;此处按整年近似,仅作帖子流年标注展示,不做任何判定。
// ─────────────────────────────────────────────────────────────

import { GAN, ZHI, getXunKong } from '@/lib/bazi-utils'
import { getLiuNianAnnotations } from '@/lib/bage/liunian'
import type { LiuNianAnnotation } from '@/types/bazi'
import type { PostDraft } from './types'

/** 公历年干支(60 甲子,1984=甲子锚点;见文件头边界说明) */
export function yearGanZhi(year: number): string {
  const idx = (((year - 1984) % 60) + 60) % 60
  return GAN[idx % 10] + ZHI[idx % 12]
}

/** DaYunTable 组件的纯数据契约(结果页与帖子详情共用) */
export interface DaYunTableData {
  startSolar: { year: number; month: number; day: number }
  isForward: boolean
  dayMaster: string
  decades: DaYunTableDecade[]
}

export interface DaYunTableDecade {
  index: number
  startYear: number
  endYear: number
  startAge: number
  endAge: number
  ganZhi: string
  xunKong: string
  liuNian: DaYunTableLiuNian[]
}

export interface DaYunTableLiuNian {
  year: number
  age: number
  ganZhi: string
  annotations: LiuNianAnnotation[]
}

/** 把帖子脱敏草稿展开成 DaYunTable 数据;无大运信息返回 null */
export function buildDaYunTableData(draft: PostDraft): DaYunTableData | null {
  if (!draft.daYun) return null
  const pillars = {
    yearGanZhi: draft.pillars.year.stem + draft.pillars.year.branch,
    monthGanZhi: draft.pillars.month.stem + draft.pillars.month.branch,
    dayGanZhi: draft.pillars.day.stem + draft.pillars.day.branch,
    hourGanZhi: draft.pillars.hour
      ? draft.pillars.hour.stem + draft.pillars.hour.branch
      : '',
  }
  return {
    startSolar: draft.daYun.startSolar,
    isForward: draft.daYun.isForward,
    dayMaster: draft.dayMaster,
    decades: draft.daYun.decades.map((d, index) => ({
      index,
      startYear: d.startYear,
      endYear: d.startYear + 9,
      startAge: d.startAge,
      endAge: d.startAge + 9,
      ganZhi: d.ganZhi,
      xunKong: getXunKong(d.ganZhi),
      liuNian: Array.from({ length: 10 }, (_, i) => {
        const year = d.startYear + i
        const liuNianGanZhi = yearGanZhi(year)
        return {
          year,
          age: d.startAge + i,
          ganZhi: liuNianGanZhi,
          annotations: getLiuNianAnnotations({
            liuNianGanZhi,
            daYunGanZhi: d.ganZhi,
            ...pillars,
          }),
        }
      }),
    })),
  }
}
