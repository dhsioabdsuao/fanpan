import type { FlowFactPack } from '../types'

export function replacePlaceholders(
  text: string,
  placeholders: FlowFactPack['placeholders']
): string {
  let result = text

  for (const [key, value] of Object.entries(placeholders)) {
    const pattern = new RegExp(`\\[${escapeRegex(key)}\\]`, 'g')
    result = result.replace(pattern, value)
  }

  // 检查残留占位符
  const residual = result.match(/\[.+?\]/g)
  if (residual) {
    throw new Error(
      `LLM 使用了未定义的占位符: ${residual.join(', ')}`
    )
  }

  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
