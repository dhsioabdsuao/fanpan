export interface LlmProvider {
  generate(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<string>
  readonly name: string
}
