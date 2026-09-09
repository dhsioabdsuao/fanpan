// ─────────────────────────────────────────────────────────────
// 手机号掩码(纯函数)
// ─────────────────────────────────────────────────────────────

const CN_MOBILE = /^1[3-9]\d{9}$/

/**
 * 13812345678 → 138****5678。
 * 非 11 位大陆手机号原样返回(异常数据不硬遮)。
 */
export function maskPhone(phone: string): string {
  if (!CN_MOBILE.test(phone)) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/** 默认昵称:命友·138****5678 */
export function defaultNickname(phone: string): string {
  return `命友·${maskPhone(phone)}`
}
