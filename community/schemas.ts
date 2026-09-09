// ─────────────────────────────────────────────────────────────
// 社区 zod schema(登录表单 / 求测问题 / 批注 / 发布请求体白名单)
//
// 双端 zod 均为 ^4.4.3;resolver 写法照抄 BirthForm.tsx 的
// Resolver<T> 模式(见 adapters/bazi-input-adapter.ts)。
// PostDraftSchema 是发布请求体白名单:zod object 默认 strip
// 未知键 —— 任何不在白名单的字段(如出生分钟/地点)在提交时被剥除,
// 与 PostDraft 类型不含出生字段构成脱敏双保险。
// ─────────────────────────────────────────────────────────────

import { z } from 'zod'

export const LoginFormSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字'),
  agreed: z.boolean().refine((v) => v === true, {
    message: '请先阅读并同意《用户协议》与《隐私政策》',
  }),
})

export type LoginFormData = z.infer<typeof LoginFormSchema>

export const QuestionSchema = z.string().trim().min(5, '问题至少 5 个字').max(200, '问题最多 200 字')

/** 发布表单(对象形态,供 react-hook-form resolver 使用) */
export const QuestionFormSchema = z.object({ question: QuestionSchema })
export type QuestionFormData = z.infer<typeof QuestionFormSchema>

export const AnnotationSchema = z
  .string()
  .trim()
  .min(10, '批注至少 10 个字')
  .max(500, '批注最多 500 字')

const ElementEnum = z.enum(['金', '木', '水', '火', '土'])

const PillarDataSchema = z.object({
  stem: z.string(),
  branch: z.string(),
  stemElement: ElementEnum,
  branchElement: ElementEnum,
  hiddenStems: z.array(z.string()),
  tenGod: z.string().nullable(),
  naYin: z.string(),
})

const DaYunSummarySchema = z.object({
  startSolar: z.object({
    year: z.number().int(),
    month: z.number().int(),
    day: z.number().int(),
  }),
  isForward: z.boolean(),
  decades: z.array(
    z.object({
      startYear: z.number().int(),
      startAge: z.number().int(),
      ganZhi: z.string(),
    }),
  ),
})

/** 发布请求体白名单(strip 未知键)。与 PostDraft 类型保持一致。 */
export const PostDraftSchema = z.object({
  gender: z.enum(['male', 'female']),
  baziBrief: z.string(),
  pillars: z.object({
    year: PillarDataSchema,
    month: PillarDataSchema,
    day: PillarDataSchema,
    hour: PillarDataSchema.nullable(),
  }),
  dayMaster: z.string(),
  dayMasterElement: ElementEnum,
  pattern: z.object({
    displayName: z.string(),
    outcome: z.string(),
    summary: z.string(),
  }),
  strength: z.object({ level: z.enum(['身强', '中和', '身弱']) }),
  xiYong: z.object({
    favorable: z.array(ElementEnum),
    avoid: z.array(ElementEnum),
    yongShenTenGod: z.string().nullable(),
  }),
  shensha: z.array(z.object({ name: z.string(), pillar: z.string() })),
  daYun: DaYunSummarySchema.nullable(),
})

/** 举报理由枚举 */
export const REPORT_REASONS = [
  '色情低俗',
  '人身攻击',
  '广告营销',
  '违法违规',
  '其他',
] as const

export const ReportReasonSchema = z.enum(REPORT_REASONS)
export type ReportReason = z.infer<typeof ReportReasonSchema>
