export const runtime = 'nodejs'
export const maxDuration = 240

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { calculateBazi } from '@/lib/bazi'
import { calculateDayMasterStrength } from '@/lib/strength'
import { buildFactPack } from '@/lib/flow'
import { generateFlowReading } from '@/lib/flow/llm'
import { deriveYongShen } from '@/lib/yongshen'
import { generateYongShenReading } from '@/lib/yongshen/llm/orchestrator'

// 每次修改 prompt 逻辑后手动 +1，使旧缓存自动失效
// 当前为第 5 版（初版→性格深度→字数→fallback→性格词典）
const PROMPT_VERSION = 5

const CACHE_DIR = path.join(process.cwd(), '.cache', 'flow-readings')

function getCacheKey(bazi: ReturnType<typeof calculateBazi>, gender: string): string {
  const p = bazi.pillars
  const raw = `${p.year.stem}${p.year.branch}_${p.month.stem}${p.month.branch}_${p.day.stem}${p.day.branch}_${p.hour.stem}${p.hour.branch}_${gender}`
  return crypto.createHash('md5').update(raw).digest('hex')
}

async function getCachedReading(key: string) {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`)
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function setCachedReading(key: string, result: unknown) {
  await mkdir(CACHE_DIR, { recursive: true })
  const filePath = path.join(CACHE_DIR, `${key}.json`)
  await writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8')
}

const BodySchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  gender: z.enum(['male', 'female']),
  isLunar: z.boolean(),
  isLeapMonth: z.boolean().optional(),
  birthPlace: z
    .object({
      province: z.string(),
      city: z.string(),
      district: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = BodySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: '输入参数不合法' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const baziResult = calculateBazi(input)
    const strengthResult = calculateDayMasterStrength(baziResult)

    const factPack = buildFactPack(baziResult, strengthResult)
    const yongshen = deriveYongShen(baziResult, strengthResult, factPack)

    // 检查缓存：版本不匹配视为无缓存
    const cacheKey = getCacheKey(baziResult, input.gender === 'male' ? '男' : '女')
    const cached = await getCachedReading(cacheKey)
    if (cached && cached.promptVersion === PROMPT_VERSION) {
      // 兼容旧缓存（没有 yongshenReading 字段）
      if (!cached.yongshenReading) {
        const yongshenReading = await generateYongShenReading(yongshen)
        cached.yongshenReading = {
          text: yongshenReading.text,
          source: yongshenReading.source,
          attempts: yongshenReading.attempts,
          retryReasons: yongshenReading.retryReasons,
        }
        await setCachedReading(cacheKey, cached)
      }
      return NextResponse.json({ ...cached, yongshen, fromCache: true })
    }

    const reading = await generateFlowReading(factPack)
    const yongshenReading = await generateYongShenReading(yongshen)

    const responseData = {
      promptVersion: PROMPT_VERSION,
      reading: reading.text,
      source: reading.source,
      attempts: reading.attempts,
      retryReasons: reading.retryReasons,
      factPack,
      yongshen,
      yongshenReading: {
        text: yongshenReading.text,
        source: yongshenReading.source,
        attempts: yongshenReading.attempts,
        retryReasons: yongshenReading.retryReasons,
      },
    }
    await setCachedReading(cacheKey, responseData)

    return NextResponse.json(responseData)
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常'
    // 不暴露 API key 相关细节
    if (msg.includes('DEEPSEEK_API_KEY') || msg.includes('sk-')) {
      return NextResponse.json({ error: '服务配置异常' }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
