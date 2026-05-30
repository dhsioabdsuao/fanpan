'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, RefreshCw } from 'lucide-react'
import type { YongShenResult } from '@/lib/yongshen'

const CLOSING = '命局给出的是倾向，不是定数。你比命盘更了解自己。'

function buildReasoningText(yongshen: YongShenResult): string | null {
  const { primaryMethod, fuYi, tiaoHou, tongGuan } = yongshen

  // 化格 / 从格：统一措辞
  if (primaryMethod === '化格' || primaryMethod === '从格') {
    return '命局气势已成一方，顺其势而取用，不取常规的扶抑平衡。'
  }

  // 通关（primaryMethod 目前始终为扶抑，通关与否看 tongGuan.active）
  if (tongGuan?.active && tongGuan?.clashingPair && tongGuan?.mediator) {
    const [a, b] = tongGuan.clashingPair
    return `${a}${b}相战，以${tongGuan.mediator}通关调和。`
  }

  // 扶抑
  if (primaryMethod === '扶抑') {
    const dir = fuYi?.direction
    let sentence: string

    if (dir === '克泄耗') {
      sentence = '日主偏强，宜耗泄过旺的力量、助命局流通。'
    } else if (dir === '生扶') {
      sentence = '日主偏弱，宜生扶助其壮旺。'
    } else {
      sentence = '日主中和，取五行调和、流通为用。'
    }

    // 调候子句：仅 level≤2 且非平衡/木火通明
    if (
      tiaoHou?.active &&
      tiaoHou.level <= 2 &&
      tiaoHou.pattern !== '平衡' &&
      tiaoHou.pattern !== '木火通明'
    ) {
      const needsStr = tiaoHou.needs.join('、')
      sentence += `命局${tiaoHou.pattern}，兼补${needsStr}。`
    }

    return sentence
  }

  return null
}

export function YongShenSection({
  yongshen,
  reading,
  source,
  onRegenerate,
}: {
  yongshen: YongShenResult
  reading?: string
  source?: 'llm' | 'fallback'
  onRegenerate?: () => void
}) {
  const { yongShen, jiShen, primaryMethod } = yongshen
  const [cooldown, setCooldown] = useState(0)
  const [reasoningOpen, setReasoningOpen] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleRegenerate = useCallback(() => {
    if (cooldown > 0 || !onRegenerate) return
    setCooldown(10)
    onRegenerate()
  }, [cooldown, onRegenerate])

  const isSpecialGe = primaryMethod === '化格' || primaryMethod === '从格'
  const subtitle = isSpecialGe ? '顺势取用，喜用神顺其势而定' : '综合扶抑、调候、通关推算'
  const reasoningText = buildReasoningText(yongshen)

  const closingIndex = reading ? reading.lastIndexOf(CLOSING) : -1
  const mainText = closingIndex > 0 ? reading!.slice(0, closingIndex).trim() : reading
  const hasClosing = closingIndex > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">喜用神</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fallback 提示 */}
        {source === 'fallback' && (
          <div className="flex items-center justify-between rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-sm text-amber-800">
              解读生成遇到波动，当前为简要版本
            </span>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                disabled={cooldown > 0}
                onClick={handleRegenerate}
                className="shrink-0 ml-4"
              >
                <RefreshCw className={`mr-1 size-3 ${cooldown > 0 ? 'animate-spin' : ''}`} />
                {cooldown > 0 ? `${cooldown}s 后重试` : '重新生成'}
              </Button>
            )}
          </div>
        )}

        {/* 徽章区 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground shrink-0 w-12">喜用</span>
            {yongShen.map((g) => (
              <span
                key={g.gan}
                className="inline-flex items-center rounded-md bg-emerald-50 px-3 py-1 text-base text-emerald-800"
              >
                {g.gan}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground shrink-0 w-12">忌</span>
            {jiShen.slice(0, 3).map((g) => (
              <span
                key={g.gan}
                className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1 text-base text-rose-700"
              >
                {g.gan}
              </span>
            ))}
          </div>
        </div>

        {/* 取用依据 */}
        {reasoningText && (
          <div className="border-t pt-4">
            <button
              onClick={() => setReasoningOpen(!reasoningOpen)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-sm text-stone-400">取用依据</span>
              <ChevronDown
                className={`size-4 text-stone-400 transition-transform duration-200 ${
                  reasoningOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ${
                reasoningOpen
                  ? 'grid-rows-[1fr] opacity-100 mt-3'
                  : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-stone-500 leading-relaxed">
                  {reasoningText}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LLM 解读文案 */}
        {reading ? (
          <div className="border-t pt-4">
            <div className="text-base leading-relaxed whitespace-pre-line">
              {mainText}
            </div>
            {hasClosing && (
              <p className="mt-6 text-center text-sm text-stone-400">
                {CLOSING}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">解读加载中...</p>
        )}
      </CardContent>
    </Card>
  )
}
