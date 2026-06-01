import type { BaziResult } from '@/types/bazi'
import type { DayMasterStrength } from '@/lib/strength'
import type { YongShenResult } from '../types'
import type { LlmProvider } from '@/lib/flow/llm'
import { DeepSeekProvider } from '@/lib/flow/llm'
import { buildYongShenFactPack } from './types'
import { buildYongShenPrompt } from './promptBuilder'
import { validateYongShenReading } from './validator'
import { generateYongShenFallback } from './fallbackTemplate'

const CLOSING_LINE = '\n\n命局给出的是倾向，不是定数。你比命盘更了解自己。'

export async function generateYongShenReading(
  yongshenResult: YongShenResult,
  bazi: BaziResult,
  strength: DayMasterStrength,
  structureTone: string,
  options?: {
    provider?: LlmProvider
    maxRetries?: number
  },
): Promise<{
  text: string
  source: 'llm' | 'fallback'
  attempts: number
  retryReasons: string[]
}> {
  const factPack = buildYongShenFactPack(yongshenResult, bazi, strength, structureTone)
  const provider = options?.provider ?? new DeepSeekProvider()
  const maxRetries = options?.maxRetries ?? 3
  const retryReasons: string[] = []

  let attempts = 0
  let apiErrors = 0
  const MAX_API_ERRORS = 2
  let lastFeedback: string | undefined

  while (attempts < maxRetries) {
    const prompt = buildYongShenPrompt(factPack, lastFeedback)

    let rawOutput: string
    try {
      rawOutput = await provider.generate(prompt)
    } catch (e) {
      apiErrors++
      const msg = e instanceof Error ? e.message : String(e)
      retryReasons.push(`API错误_第${apiErrors}次: ${msg}`)
      lastFeedback = `上次调用失败（API 错误：${msg}），请重新生成。`
      if (apiErrors >= MAX_API_ERRORS) break
      continue
    }

    // 空响应检测：< 10 字视为 API 错误，不消耗校验配额
    if (rawOutput.trim().length < 10) {
      apiErrors++
      retryReasons.push(`API空响应_第${apiErrors}次`)
      lastFeedback = '上次返回了空内容，请生成完整的喜用神解读。'
      if (apiErrors >= MAX_API_ERRORS) break
      continue
    }

    attempts++
    const validation = validateYongShenReading(rawOutput, factPack)

    if (validation.passed) {
      const text = rawOutput.trim() + CLOSING_LINE
      return {
        text,
        source: 'llm' as const,
        attempts,
        retryReasons,
      }
    }

    // 校验失败：收集违规信息作为下次重试的 feedback
    const feedback = validation.violations
      .map((v) => {
        const sev = v.severity === 'soft' ? '[提示]' : '[违规]'
        return `${sev}${v.rule}: ${v.detail}`
      })
      .join('; ')
    retryReasons.push(feedback)
    lastFeedback = feedback
  }

  // 重试用尽 → fallback
  const fallbackText = generateYongShenFallback(factPack)
  return {
    text: fallbackText + CLOSING_LINE,
    source: 'fallback' as const,
    attempts,
    retryReasons,
  }
}
