export const runtime = 'nodejs'
export const maxDuration = 90

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateBazi } from '@/lib/bazi'
import { calculateDayMasterStrength } from '@/lib/strength'
import { buildFactPack } from '@/lib/flow'
import { generateFlowReading } from '@/lib/flow/llm'

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
    const reading = await generateFlowReading(factPack)

    return NextResponse.json({
      reading: reading.text,
      source: reading.source,
      attempts: reading.attempts,
      factPack,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '服务异常'
    // 不暴露 API key 相关细节
    if (msg.includes('DEEPSEEK_API_KEY') || msg.includes('sk-')) {
      return NextResponse.json({ error: '服务配置异常' }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
