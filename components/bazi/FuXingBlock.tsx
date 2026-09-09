import type { FullAnalysis } from '@/lib/bage/analyze'
import { Card, CardContent } from '@/components/ui/card'

const PILLAR_LABELS: Record<string, string> = {
  year: '年柱',
  month: '月柱',
  day: '日柱',
  hour: '时柱',
}

/**
 * 副星(藏干十神):每柱地支藏干对应的十神。
 * 命理界通行定义:主星 = 天干十神(已示于四柱表格),副星 = 藏干十神。
 * 数据来自 BaziResult.tenGods.*Branch,与 pillars.*.hiddenStems 按构造逐位对应
 * (lib/bazi.ts),纯标注展示,不参与任何判定。
 */
export function FuXingBlock({ full, hideHour }: { full: FullAnalysis; hideHour?: boolean }) {
  const { pillars, tenGods } = full.bazi
  const keys = ['year', 'month', 'day', 'hour'] as const

  return (
    <Card className="border-amber-300/60 dark:border-amber-400/30 shadow-sm">
      <CardContent className="pt-5">
        {/* 标题 */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <span className="font-serif text-sm font-semibold text-amber-800 dark:text-amber-300">
            副星
          </span>
          <span className="text-xs text-stone-400">地支藏干对应的十神</span>
        </div>

        {/* 四列:藏干 · 十神 配对 */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {keys.map((key) => {
            const isHourHidden = hideHour && key === 'hour'
            const highlight = key === 'day'
            const stems = pillars[key].hiddenStems
            const gods = tenGods[`${key}Branch`]

            return (
              <div
                key={key}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-2 ${
                  highlight
                    ? 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-500/30'
                    : ''
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {PILLAR_LABELS[key]}
                </span>
                {isHourHidden ? (
                  <span className="py-2 text-sm text-muted-foreground">未知</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    {stems.map((stem, i) => (
                      <span
                        key={`${stem}-${i}`}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 dark:border-stone-700 dark:bg-stone-800/60"
                      >
                        <span className="font-serif text-sm font-medium text-amber-800 dark:text-amber-300">
                          {stem}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {gods[i]}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 标注说明 */}
        <p className="mt-2 text-center text-xs text-stone-400">
          副星为地支藏干对应的十神,标注展示,不参与判定
        </p>
      </CardContent>
    </Card>
  )
}
