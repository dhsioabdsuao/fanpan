import type { LlmProvider } from './provider'

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ApiError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ParseError'
  }
}

export class DeepSeekProvider implements LlmProvider {
  readonly name = 'DeepSeek V4 Pro'
  private readonly apiKey: string
  private readonly endpoint = 'https://api.deepseek.com/chat/completions'
  private readonly modelId = 'deepseek-v4-pro'

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY ?? ''
    if (!this.apiKey) {
      throw new Error(
        'DEEPSEEK_API_KEY 未配置。请在项目根目录 .env.local 添加:\n' +
        'DEEPSEEK_API_KEY=sk-xxx\n' +
        '申请地址:https://platform.deepseek.com'
      )
    }
  }

  async generate(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const temperature = options?.temperature ?? 0.7
    const maxTokens = options?.maxTokens ?? 1500

    let response: Response
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      })
    } catch (error) {
      throw new NetworkError(
        `无法连接 DeepSeek API: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    if (!response.ok) {
      let body = ''
      try { body = await response.text() } catch { /* ignore */ }
      throw new ApiError(
        response.status,
        `DeepSeek API 返回 HTTP ${response.status}: ${body.slice(0, 200)}`
      )
    }

    let data: unknown
    try {
      data = await response.json()
    } catch {
      throw new ParseError('DeepSeek API 响应不是合法的 JSON')
    }

    if (
      !data ||
      typeof data !== 'object' ||
      !('choices' in data) ||
      !Array.isArray((data as Record<string, unknown>).choices)
    ) {
      throw new ParseError('DeepSeek API 响应格式异常: 缺少 choices 数组')
    }

    const choices = (data as Record<string, unknown>).choices as Array<Record<string, unknown>>
    if (choices.length === 0) {
      throw new ParseError('DeepSeek API 返回了空的 choices 数组')
    }

    const message = choices[0].message
    if (!message || typeof message !== 'object' || typeof (message as Record<string, unknown>).content !== 'string') {
      throw new ParseError('DeepSeek API 响应格式异常: 缺少 message.content')
    }

    return (message as Record<string, unknown>).content as string
  }
}
