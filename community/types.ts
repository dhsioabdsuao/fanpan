// ─────────────────────────────────────────────────────────────
// 社区共享类型(DTO)
//
// UI 层只认这里的 DTO,不接触 LeanCloud Object——
// 将来迁移后端只改 services/community.ts 的映射,UI 零改动。
// 隐私红线:PostDraft 是云上存储的全部命盘信息,类型上
// 不含任何原始出生字段(minute/出生地/姓名/birthParams)。
// ─────────────────────────────────────────────────────────────

import type { ElementType } from '@/types/bazi'

/** 单柱序列化数据(帖子内嵌命盘卡渲染所需) */
export interface PillarData {
  stem: string
  branch: string
  stemElement: ElementType
  branchElement: ElementType
  hiddenStems: string[]
  /** 十神(年/月/时柱;日柱为日主自身,置 null) */
  tenGod: string | null
  naYin: string
}

/** 大运摘要(丢弃 liuNian/旬空,仅为展示减重) */
export interface DaYunSummary {
  startSolar: { year: number; month: number; day: number }
  isForward: boolean
  decades: { startYear: number; startAge: number; ganZhi: string }[]
}

/**
 * 求测帖命盘草稿 = 脱敏后的全部命盘信息。
 * 由 community/privacy.ts 的 buildPostDraft(full) 产生,
 * 类型层面保证不含出生原始数据。question 由发布表单单独合并。
 */
export interface PostDraft {
  gender: 'male' | 'female'
  /** 四柱串,如「庚辰 壬午 甲辰 庚午」 */
  baziBrief: string
  pillars: {
    year: PillarData
    month: PillarData
    day: PillarData
    /** 时辰未知盘为 null(移动端输入必填,恒非空;预留) */
    hour: PillarData | null
  }
  dayMaster: string
  dayMasterElement: ElementType
  pattern: { displayName: string; outcome: string; summary: string }
  strength: { level: '身强' | '中和' | '身弱' }
  xiYong: { favorable: ElementType[]; avoid: ElementType[]; yongShenTenGod: string | null }
  shensha: { name: string; pillar: string }[]
  daYun: DaYunSummary | null
}

/** 帖子作者展示信息(读取时展平,避免多一次查询) */
export interface AuthorInfo {
  id: string
  nickname: string
  /** 称号快照(批注作者用;帖子作者读取时实时映射) */
  title: string | null
}

export interface PostDTO {
  id: string
  author: AuthorInfo
  draft: PostDraft
  question: string
  annotationCount: number
  createdAt: string
}

export interface AnnotationDTO {
  id: string
  postId: string
  author: AuthorInfo
  content: string
  createdAt: string
}

export interface UserStatsDTO {
  /** 总批注数(含自帖) */
  annotationCount: number
  /** 称号计数(仅 eligible 批注) */
  titleCount: number
  lastAnnotationAt: string | null
  /** 东八区日限键 'YYYY-MM-DD' */
  lastAnnotationDate: string | null
  /** 当日批注数 */
  dailyCount: number
}

/** 登录用户(掩码手机号 + 昵称) */
export interface AuthUser {
  id: string
  phoneMasked: string
  nickname: string
}
