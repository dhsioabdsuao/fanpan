'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { YongShenResult } from '@/lib/yongshen'

export function YongShenSection({ yongshen }: { yongshen: YongShenResult }) {
  const { yongShen, jiShen, summary } = yongshen

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">喜用神</CardTitle>
        <p className="text-sm text-muted-foreground">
          综合扶抑、调候、通关推算
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 喜用神 */}
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

        {/* 忌神 */}
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

        {/* Summary */}
        <p className="text-sm text-muted-foreground pt-2 border-t">
          {summary}
        </p>
      </CardContent>
    </Card>
  )
}
