'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { YongShenResult } from '@/lib/yongshen'

const CLOSING = '命局给出的是倾向，不是定数。你比命盘更了解自己。'

export function YongShenSection({
  yongshen,
  reading,
}: {
  yongshen: YongShenResult
  reading?: string
}) {
  const { yongShen, jiShen } = yongshen

  const closingIndex = reading ? reading.lastIndexOf(CLOSING) : -1
  const mainText = closingIndex > 0 ? reading!.slice(0, closingIndex).trim() : reading
  const hasClosing = closingIndex > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">喜用神</CardTitle>
        <p className="text-sm text-muted-foreground">
          综合扶抑、调候、通关推算
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
