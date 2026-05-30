'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import type { YongShenResult } from '@/lib/yongshen'

const CLOSING = '命局给出的是倾向，不是定数。你比命盘更了解自己。'

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
