// ─────────────────────────────────────────────────────────────
// 批注防刷规则(纯函数三件套,services/community.ts 发批注前后调用)
//
// 设计原则:
//   · 自帖批注、同帖重复批注【允许发布】(自己补充说明是合理需求),
//     但不计称号 —— titleEligible = 他人帖 && 该帖自己的首条批注。
//   · 核心计数(titleCount/annotationCount)由服务端原子 increment,
//     本模块只做"该不该发"的客户端判断;被绕过后果可控(举报兜底)。
// ─────────────────────────────────────────────────────────────

export const ANNOTATION_MIN_LENGTH = 10
export const ANNOTATION_MAX_LENGTH = 500
/** 两次批注最小间隔(毫秒) */
export const ANNOTATION_COOLDOWN_MS = 30_000
/** 单日批注上限 */
export const ANNOTATION_DAILY_LIMIT = 20

export type AntiSpamViolation =
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'DUPLICATE'
  | 'COOLDOWN'
  | 'DAILY_LIMIT'

export interface DraftContext {
  /** 本次批注原文 */
  content: string
  /** 自己上一条批注原文(用于去重) */
  lastContent: string | null
  /** 上一条批注时间(epoch ms) */
  lastAt: number | null
  /** 当前时间(epoch ms,由调用方注入,便于测试) */
  now: number
  /** 当日已批注数 */
  dailyCount: number
  /** UserStats 记录的日限键(东八区 'YYYY-MM-DD') */
  lastDate: string | null
  /** 今天的日限键(东八区 'YYYY-MM-DD') */
  today: string
  postAuthorId: string
  myId: string
  /** 我是否已在该帖批注过(任何一条) */
  alreadyAnnotated: boolean
}

export interface DraftEvaluation {
  ok: boolean
  violations: AntiSpamViolation[]
  /** 仅当 ok 时有意义:这条批注是否计入称号计数 */
  titleEligible: boolean
}

/** 归一化:去空白 + 去中英文标点(用于与自己上一条去重) */
export function normalizeForCompare(text: string): string {
  return text
    .replace(/[\s　]+/g, '')
    .replace(/[，。！？、,.!?;；:：'"“”‘’()（）【】[\]{}<>《》…·~`\-—_]/g, '')
}

/** 日限重置基准:跨日则计数归 1,同日则 +1(无定时任务时的客户端归零方案) */
export function nextDaily(args: {
  lastDate: string | null
  today: string
  dailyCount: number
}): { date: string; count: number } {
  if (args.lastDate === args.today) {
    return { date: args.today, count: args.dailyCount + 1 }
  }
  return { date: args.today, count: 1 }
}

/** 批注草稿防刷评估(全部规则一次算完,违规不阻断继续收集) */
export function evaluateDraft(ctx: DraftContext): DraftEvaluation {
  const violations: AntiSpamViolation[] = []
  const trimmed = ctx.content.trim()

  if (trimmed.length < ANNOTATION_MIN_LENGTH) violations.push('TOO_SHORT')
  if (trimmed.length > ANNOTATION_MAX_LENGTH) violations.push('TOO_LONG')

  if (
    ctx.lastContent != null &&
    normalizeForCompare(trimmed) === normalizeForCompare(ctx.lastContent)
  ) {
    violations.push('DUPLICATE')
  }

  if (ctx.lastAt != null && ctx.now - ctx.lastAt < ANNOTATION_COOLDOWN_MS) {
    violations.push('COOLDOWN')
  }

  if (ctx.lastDate === ctx.today && ctx.dailyCount >= ANNOTATION_DAILY_LIMIT) {
    violations.push('DAILY_LIMIT')
  }

  const titleEligible = ctx.postAuthorId !== ctx.myId && !ctx.alreadyAnnotated

  return { ok: violations.length === 0, violations, titleEligible }
}
