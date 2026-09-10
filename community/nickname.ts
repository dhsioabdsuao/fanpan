// ─────────────────────────────────────────────────────────────
// 昵称校验(纯函数)
//
// 规则(产品定案 2026-09-10):2-12 字,汉字/字母/数字/中点 ·;
// 禁止纯 11 位大陆手机号格式(昵称公开显示,等于手机号即自曝号码);
// 敏感词过滤与批注同源。客户端过滤可被绕过,兜底是举报 + 后台处理。
//
// 检查顺序固定:empty → too_short → too_long → invalid_chars →
// is_phone → sensitive;UI 与测试一律断言 reason 码,不断言文案。
// ─────────────────────────────────────────────────────────────

import { containsSensitive } from './sensitiveWords'
import { CN_MOBILE } from './mask'

export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12

/** 汉字 / ASCII 字母数字 / 中点 ·。仅含 BMP 单单元字符,value.length 与 RN TextInput maxLength 一致 */
export const NICKNAME_CHARSET_RE = /^[一-龥A-Za-z0-9·]+$/

export type NicknameRejectReason =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'is_phone'
  | 'sensitive'

export type NicknameEvaluation =
  | { valid: true; value: string }
  | { valid: false; reason: NicknameRejectReason }

export function evaluateNickname(input: string): NicknameEvaluation {
  const value = input.trim()
  if (!value) return { valid: false, reason: 'empty' }
  if (value.length < NICKNAME_MIN) return { valid: false, reason: 'too_short' }
  if (value.length > NICKNAME_MAX) return { valid: false, reason: 'too_long' }
  if (!NICKNAME_CHARSET_RE.test(value)) return { valid: false, reason: 'invalid_chars' }
  // 仅拦 1[3-9] 开头的纯 11 位数字;带 * 的旧默认昵称在字符集一步已拒
  if (CN_MOBILE.test(value)) return { valid: false, reason: 'is_phone' }
  if (containsSensitive(value)) return { valid: false, reason: 'sensitive' }
  return { valid: true, value }
}

/** reason → 中文提示(UI 层映射;测试断言 reason 码而非文案) */
export const NICKNAME_REJECT_MESSAGES: Record<NicknameRejectReason, string> = {
  empty: '请输入昵称',
  too_short: '昵称至少 2 个字',
  too_long: '昵称最多 12 个字',
  invalid_chars: '昵称仅支持汉字、字母、数字和·',
  is_phone: '昵称不能是手机号',
  sensitive: '昵称包含不适宜词汇,请修改后重试',
}

export function nicknameRejectMessage(reason: NicknameRejectReason): string {
  return NICKNAME_REJECT_MESSAGES[reason]
}
