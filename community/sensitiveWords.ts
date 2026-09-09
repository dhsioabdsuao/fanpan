// ─────────────────────────────────────────────────────────────
// 敏感词检测(纯函数)
//
// 降级策略:客户端过滤可被绕过,兜底是举报 + 开发者后台处理;
// 远期硬化 = 云引擎 onBeforeSave 服务端校验。
// ─────────────────────────────────────────────────────────────

import { SENSITIVE_WORDS } from './wordlist'

/**
 * 检测文本是否包含敏感词。
 * @returns 命中的第一个敏感词;未命中返回 null
 */
export function containsSensitive(text: string): string | null {
  for (const words of Object.values(SENSITIVE_WORDS)) {
    for (const word of words) {
      if (text.includes(word)) return word
    }
  }
  return null
}
