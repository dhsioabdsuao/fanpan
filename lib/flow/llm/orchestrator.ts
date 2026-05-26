import type { FlowFactPack } from '../types'
import type { LlmProvider } from './provider'
import { DeepSeekProvider } from './deepseekProvider'
import { buildPrompt } from './promptBuilder'
import { validateLlmOutput, type ValidationResult } from './validator'
import { replacePlaceholders } from './placeholderReplacer'
import { generateFallbackFromTemplate } from './fallbackTemplate'

const CLOSING_LINE = '\n\n命局给出的是倾向,不是定数。你比命盘更了解自己。'

export async function generateFlowReading(
  factPack: FlowFactPack,
  options?: {
    provider?: LlmProvider
    maxRetries?: number
  }
): Promise<{
  text: string
  source: 'llm' | 'fallback'
  attempts: number
  retryReasons: string[]
}> {
  const provider = options?.provider ?? new DeepSeekProvider()
  const maxRetries = options?.maxRetries ?? 3
  const retryReasons: string[] = []
  let lastValidation: ValidationResult | undefined
  let apiRetries = 0
  const MAX_API_RETRIES = 2

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const prompt = buildPrompt(factPack, lastValidation)

    let rawOutput: string
    try {
      rawOutput = await provider.generate(prompt)
    } catch (e) {
      retryReasons.push(
        `第${attempt}次调用失败: ${e instanceof Error ? e.message : String(e)}`
      )
      continue
    }

    // 空响应检测: LLM 返回空内容视为 API 错误,不消耗校验配额
    if (rawOutput.trim().length < 10) {
      if (apiRetries < MAX_API_RETRIES) {
        apiRetries++
        retryReasons.push(`API空响应_第${apiRetries}次API重试`)
        attempt--
        continue
      }
    }

    const validation = validateLlmOutput(rawOutput, factPack)

    if (validation.passed) {
      const text = replacePlaceholders(rawOutput, factPack.placeholders) + CLOSING_LINE
      return {
        text,
        source: 'llm',
        attempts: attempt,
        retryReasons,
      }
    }

    lastValidation = validation
    retryReasons.push(
      `第${attempt}次校验失败: ${validation.violations.map(v =>
        `${v.rule}(${v.detail})${v.snippet ? ' snippet: ' + v.snippet : ''}`
      ).join('; ')}`
    )
  }

  // 重试用尽,fallback
  const text = generateFallbackFromTemplate(factPack) + CLOSING_LINE
  return {
    text,
    source: 'fallback',
    attempts: maxRetries,
    retryReasons,
  }
}
